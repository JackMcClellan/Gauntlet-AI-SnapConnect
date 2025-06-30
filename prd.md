# 📱 SnapFix - Project Requirements Document

*Visual Storytelling Meets AI-Powered Repair Knowledge*

---

## 🧭 Executive Summary

**SnapFix** is a mobile-first, RAG-powered ephemeral social platform built for interest enthusiasts—especially DIYers, handymen, homeowners, and builders—who want to document, share, and discover how things get fixed or built. Users post photo/video stories of projects, get AI suggestions on how to repair or upgrade their space, and connect with others over shared build/fix experiences. AI curates stories, generates content, and retrieves relevant guidance tailored to each user's needs.

---

## 👥 Target User Type & Niche

- **User Type**: Interest Enthusiasts  
- **Niche**: DIYers, handymen, homeowners, builders, makers

### Sample Personas

- 🧰 *Logan*, a handyman sharing creative plumbing fixes  
- 🏠 *Amy*, a first-time homeowner looking for how-tos on repairs  
- 🛠 *Ravi*, a maker documenting his woodworking projects

---

## 🎯 Core MVP Features

1. **Photo & Video Capture**  
2. **Filters & Effects** (DIY-themed AR filters like tape measures)  
3. **Stories Feed** (24hr ephemeral content)  
4. **Direct Messaging** (text, photo, and video support)  
5. **User Auth & Profiles**  
6. **RAG-Powered Content Personalization & Suggestions**

---

## 🧠 RAG-Powered User Stories

1. *"As a social media user, I want AI to generate engaging captions for my photos so I don't have to think of what to write."*
2. *"As a content creator, I want AI to automatically tag my posts with relevant keywords so my content is more discoverable."*
3. *"As a user browsing the discover feed, I want to search for content by typing topics like 'coffee' or 'workout' and find relevant posts."*
4. *"As someone sharing a story, I want AI to suggest different caption styles (casual, creative, professional) based on my content."*
5. *"As a user, I want to search through my friends' public content to find specific moments or activities we shared."*
6. *"As a content consumer, I want the app to understand what I'm interested in and help me discover similar content from other users."*

---

## 🏗️ Architecture & Tech Stack

See `snapfix_technical_details.md` for implementation breakdown.

---

## 🔁 RAG Workflow

```plaintext
User Action → Input Embedding → Vector Search → Top Results Retrieved
         ↘                                     ↗
       OpenAI GPT-4  ← Prompt Template + Results → Final AI Output (caption, suggestion, etc.)
```

Example:  
> Uploads a video and give the context “Sink won’t drain” → AI retrieves generates tags based on context and generates a caption based on context and tone you are going for

---

## ✅ Success Metrics

### Functional
- ✅ All 6 RAG user stories implemented
- ✅ Full MVP feature set working
- ✅ Sub-3s latency for RAG suggestions
- ✅ Mobile deployment live via Expo or EAS

### RAG Quality
- 🧠 AI-generated captions match repair context
- 📊 Feed shows measurable personalization
- 🧩 External data used in 3+ suggestion types
- 🧬 Suggestions adapt after multiple posts/interactions

---

## 🗓️ Timeline

| Date      | Milestone                                               |
|-----------|----------------------------------------------------------|
| June 24   | Submit core MVP (media sharing, stories, DM)            |
| June 25–27| RAG development (captions, fix suggestions, content)    |
| June 27   | Early submission (6 working user stories)               |
| June 29   | Final submission (RAG demos, live app, GitHub, video)   |

---
