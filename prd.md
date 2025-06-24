# 📱 SnapFix - Project Requirements Document

*Visual Storytelling Meets AI-Powered Repair Knowledge*

---

## 🧭 Executive Summary

**SnapFix** is a mobile-first, RAG-powered ephemeral social platform built for interest enthusiasts—especially DIYers, handymen, homeowners, and builders—who want to document, share, and discover how things get fixed or built. Users post photo/video stories of projects, get AI suggestions on how to repair or upgrade their space, and connect with others over shared build/fix experiences. AI curates stories, generates content, and retrieves relevant guidance tailored to each user’s needs.

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

1. *"As a new homeowner, I want AI to suggest quick fix projects for my house based on what I’ve viewed and posted."*
2. *"As a handyman, I want AI to generate captions for my project videos that explain steps and materials used."*
3. *"As a user, I want to take a picture of a broken object and get repair suggestions with links to relevant tools or guides."*
4. *"As a DIY hobbyist, I want to get daily content ideas based on trends and my interests."*
5. *"As a user, I want to receive relevant fix-it videos when I message someone about a problem."*
6. *"As a creator, I want to tag materials/tools in my posts and have AI suggest relevant alternatives or cost-saving options."*

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
> Uploads a video titled “Sink won’t drain” → AI retrieves 3 relevant fix videos + a written guide → GPT-4 generates caption + fix instructions

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
