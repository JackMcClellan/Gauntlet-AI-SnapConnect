# API Design Rules & Standards

## Overview
This document defines the standards and conventions for all backend APIs across projects using FastAPI and Supabase to ensure consistency, maintainability, and developer experience.

## URL Structure & Naming

### Base URL Format
```
[PROTOCOL]://[DOMAIN]/[RESOURCE]
```

### Resource Naming Rules
- **Always use plural nouns** for collections: `/users`, `/orders`, `/products`
- **Use kebab-case** for multi-word resources: `/user-profiles`, `/order-items`
- **Use nested resources** for relationships: `/users/{userId}/orders`
- **No versioning** - whatever is published is current

### Special Endpoints
- **User profile endpoint**: `/me` - returns current authenticated user's information using auth_id

## HTTP Methods & Status Codes

### Standard HTTP Methods
| Method | Purpose | Authentication Required |
|--------|---------|------------------------|
| GET | Retrieve resource(s) | Yes (unless specified otherwise) |
| POST | Create new resource | Yes |
| PATCH | Partial update | Yes |
| DELETE | Soft delete resource | Yes |

### Standard Status Codes
| Code | Usage |
|------|-------|
| 200 | All successful responses |
| 400 | General client errors |
| 422 | Data validation errors (wrong type, format) |
| 500 | Unhandled server errors |

## Standard Resource Endpoints

Every resource follows this pattern:

### GET `/[resource]` - Get All
- **Purpose**: Retrieve all resources with filtering and pagination
- **Authentication**: Required
- **Query Parameters**:
  - `page` - Page number (default: 1)
  - `size` - Items per page (default: 20)
  - Resource-specific filters as needed
- **Response**: Array of resource objects

### GET `/[resource]/{resourceId}` - Get by ID
- **Purpose**: Retrieve single resource by UUID
- **Authentication**: Required
- **Response**: Single resource object (direct JSON, no wrapper)

### POST `/[resource]` - Create
- **Purpose**: Create new resource
- **Authentication**: Required
- **Request Body**: Resource creation data
- **Response**: Created resource object

### PATCH `/[resource]/{resourceId}` - Update
- **Purpose**: Partial update of resource
- **Authentication**: Required
- **Request Body**: Only fields being updated
- **Response**: Updated resource object

### DELETE `/[resource]/{resourceId}` - Soft Delete
- **Purpose**: Soft delete resource (marks as deleted, doesn't remove)
- **Authentication**: Required
- **Response**: Empty response or confirmation

## Authentication

### JWT Token Standard
- **Header**: `Authorization: Bearer {token}`
- **Implementation**: Use shared authentication function across all endpoints
- **Default**: All endpoints require authentication unless explicitly specified otherwise
- **Alternative methods**: Supported but must use shared authentication function

### Special Authentication Endpoints
- `/me` - Uses auth_id from JWT to return current user information

## Request/Response Format

### Content Type
- **Default**: `application/json`
- **File uploads**: `multipart/form-data`

### Field Naming Convention
- **Always use camelCase**: `firstName`, `lastName`, `createdAt`, `userId`

### Response Structure
**GET by ID responses (200):**
```json
{
  "userId": "uuid-string",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "createdAt": "2025-06-29T12:00:00Z"
}
```

**GET all responses (200):**
```json
{
  "items": [
    {
      "userId": "uuid-string",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "createdAt": "2025-06-29T12:00:00Z"
    }
  ],
  "page": 1,
  "size": 20,
  "total": 150,
  "totalPages": 8
}
```

**Other successful responses (200):**
```json
{
    {} // or []
}
```

**Error responses:**
```json
{
  "message": "Error description"
}
```

### Response Schemas
- **Always use Pydantic response models** for FastAPI
- **Use Supabase type definitions** where applicable
- **Maintain consistency** between get_all and get_by_id responses

## Data Validation & Types

### Primary Keys
- **Always use UUIDs** for resource IDs
- **Field naming**: `{resourceName}Id` (e.g., `userId`, `orderId`)

### Validation Rules
- **422 Status**: Wrong data type (expecting string, got number)
- **400 Status**: Other client errors
- **500 Status**: Unhandled server errors

## Database Integration

### Table Mapping
- **Each resource maps to a database table**
- **Use Supabase for database operations**
- **Maintain consistent field naming** between API and database

### Soft Delete Implementation
- **DELETE endpoints perform soft deletes only**
- **Add deleted_at timestamp field** to track deletion
- **Filter out soft-deleted records** in GET operations

## Pagination

### Query Parameters
```
?page=1&size=20
```

### Default Values
- **page**: 1
- **size**: 20

### Response Format
```json
{
  "items": [
    // array of resources
  ],
  "page": 1,
  "size": 20,
  "total": 150,
  "totalPages": 8
}
```

## Filtering

### Standard Filtering
- **Available on GET `/[resource]` endpoints**
- **Resource-specific filters** as query parameters
- **Examples**:
  ```
  /users?status=active
  /orders?userId=123&status=pending
  ```

## Documentation Standards

### FastAPI Integration
- **Use FastAPI's automatic Swagger generation**
- **Document all endpoints** with proper descriptions
- **Include request/response examples**
- **Define Pydantic models** for automatic schema generation

### Endpoint Documentation Template
```python
@app.get("/users", response_model=List[UserResponse])
async def get_users(
    page: int = Query(1, description="Page number"),
    size: int = Query(20, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status")
):
    """
    Get all users with optional filtering and pagination.
    
    - **page**: Page number (default: 1)
    - **size**: Items per page (default: 20, max: 100)
    - **status**: Filter users by status
    """
```

## Error Handling

### Error Response Format
```json
{
  "message": "Descriptive error message"
}
```

### Common Error Messages
- **422**: "Invalid data type for field 'email': expected string, got number"
- **400**: "User with this email already exists"
- **404**: "User not found"
- **401**: "Authentication required"

## Example Resource Implementation

### Users Resource
```
GET    /users           # Get all users (paginated, filterable)
GET    /users/{userId}  # Get user by ID
POST   /users           # Create new user
PATCH  /users/{userId}  # Update user
DELETE /users/{userId}  # Soft delete user
GET    /me              # Get current user info
```

### Nested Resource Example
```
GET    /users/{userId}/orders        # Get user's orders
POST   /users/{userId}/orders        # Create order for user
GET    /users/{userId}/orders/{orderId}  # Get specific user order
```

## FastAPI + Supabase Integration

### Database Connection
- **Use Supabase client** for all database operations
- **Implement connection pooling** as needed
- **Handle database errors** gracefully

### Pydantic Models
```python
class UserResponse(BaseModel):
    userId: str
    firstName: str
    lastName: str
    email: str
    createdAt: datetime
    updatedAt: datetime

class UserListResponse(BaseModel):
    items: List[UserResponse]
    page: int
    size: int
    total: int
    totalPages: int

class UserCreate(BaseModel):
    firstName: str
    lastName: str
    email: str

class UserUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    email: Optional[str] = None
```

### Authentication Function
```python
async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Shared authentication function for all endpoints"""
    # JWT validation logic
    # Return user info or raise HTTPException
```

---

## Implementation Checklist

For each new resource:
- [ ] Create database table with UUID primary key
- [ ] Implement all 5 standard endpoints (GET, GET by ID, POST, PATCH, DELETE)
- [ ] Create Pydantic request/response models
- [ ] Add authentication to all endpoints
- [ ] Implement soft delete functionality
- [ ] Add pagination to GET all endpoint
- [ ] Add resource-specific filtering
- [ ] Document endpoints with FastAPI decorators
- [ ] Test all endpoints with different scenarios