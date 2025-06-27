import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'

export async function createFileWithUpload(
  supabase: SupabaseClient,
  user: User,
  file: File,
  caption: string | null,
  tags: string[] | null
) {
  const filePath = `${user.id}/${crypto.randomUUID()}`

  // 1. Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('files')
    .upload(filePath, file, { contentType: file.type })

  if (uploadError) {
    throw new Error(`Storage upload failed: ${uploadError.message}`)
  }

  // 2. Insert into database
  const { data: dbData, error: dbError } = await supabase.from('files')
    .insert({
      user_id: user.id,
      storage_path: filePath,
      file_type: file.type.startsWith('image') ? 'image' : 'video',
      caption: caption,
      tags: tags,
    })
    .select()
    .single()
  
  // 3. If database insert fails, rollback storage upload
  if (dbError) {
    await supabase.storage.from('files').remove([filePath])
    throw new Error(`Database insert failed: ${dbError.message}`)
  }

  return dbData
}


export async function deleteFileAndStorage(supabase: SupabaseClient, id: string) {
  // 1. Delete from database and get the storage path
  const { data: dbData, error: dbError } = await supabase
    .from('files')
    .delete()
    .eq('id', id)
    .select()
    .single()

  if (dbError) {
    throw new Error(`Database delete failed: ${dbError.message}`)
  }
  
  // 2. If DB deletion is successful, delete from storage
  if (dbData?.storage_path) {
    const { error: storageError } = await supabase.storage.from('files').remove([dbData.storage_path])
    if (storageError) {
      // Note: At this point, the DB record is gone, but storage deletion failed.
      // This is an unrecoverable state without more complex transaction logic (e.g., a queue).
      // We'll log it for now.
      console.error(`Failed to delete file from storage, but DB record is gone: ${storageError.message}`)
    }
  }

  return dbData
} 