# Openly — Agent Design & Dev Rules

Read this file before every single task. These rules 
apply to every change you make in this project without 
exception.

---

## 🎨 Design System

### Colors — never deviate
- Page background: #f5f0e8
- Card background: #ede8dc
- Card border: 1px solid #ddd5c8
- Input background: #faf7f2
- Input border: 1px solid #ddd5c8
- Primary accent: #c2674a (terracotta)
- Secondary accent: #7c8c5e (olive green)
- Dark: #1c1917 (charcoal)
- Heading text: #2c1f14
- Secondary text: #6b5c4e
- Muted text: #9c8c7e

### NEVER use
- Pure white #ffffff anywhere
- Pure black #000000
- Any shade of blue, purple, indigo
- gray-900 or any Tailwind default grays
- Any neon or glowing colors

### Typography
- Headings: Fraunces (serif) — every heading, 
  every page, no exceptions
- Body + UI text: DM Sans
- Never use Inter, Geist, or system-ui for headings

### Icons
- Phosphor Icons ONLY
- Never Heroicons, Lucide, or Material Icons

---

## 🃏 Cards — applies to EVERY card in the app
background: #ede8dc
border: 1px solid #ddd5c8
border-radius: 16px
padding: 24px
hover: transform translateY(-4px)
hover shadow: 0 8px 32px rgba(44,31,20,0.10)
transition: all 0.25s ease

Never render a card with white or transparent background.

---

## 📝 Inputs — applies to EVERY input and textarea
background: #faf7f2
border: 1px solid #ddd5c8
border-radius: 12px
padding: 12px 16px
font-family: DM Sans
focus: border-color #c2674a
focus shadow: 0 0 0 3px rgba(194,103,74,0.15)
Textareas: resize none, auto-grow with content
No resize handle ever

---

## 🔘 Buttons
Primary:
  background: #1c1917
  color: #f5f0e8
  border-radius: 9999px
  padding: 14px 28px
  hover: background #2c2420, scale 1.02

Secondary:
  background: transparent
  border: 1px solid #1c1917
  color: #1c1917
  border-radius: 9999px
  padding: 14px 28px
  hover: background #1c1917, color #f5f0e8

Danger:
  background: #c0392b
  color: white
  border-radius: 9999px

Never use default Tailwind blue buttons anywhere.

---

## 🏷️ Room Type Badges — CRITICAL
NEVER display raw underscore labels anywhere in the app.
HOT_TAKE, DECISION_VOTE, PULSE_CHECK are forbidden.

Always display as formatted colored pills:
- Pulse Check → bg #e8f0e0, text #7c8c5e
- Open Feedback → bg #e0eaf0, text #4a6580
- Q&A → bg #ede0f0, text #7c5c8c
- Decision Vote → bg #f0ebe0, text #8c6c2c
- Hot Take → bg #f5ebe8, text #c2674a

Create a single RoomTypeBadge component and use it 
everywhere — dashboard, results, create flow, 
responder view, everywhere.

---

## ✨ Animations — Framer Motion throughout
Page load: opacity 0→1, y 20→0, duration 0.4s
Staggered lists: 0.05s delay between each item
Card hover: translateY -4px + shadow increase
Numbers: count-up animation on mount
Skeletons: warm cream #e5dfd4 shimmer, never gray
Page transitions: crossfade 0.3s
Button hover: scale 1.02, smooth 0.2s
Input focus: border color transition 0.2s

---

## 📄 Page Rules

### Dashboard
- NO hero section, NO marketing copy
- Greeting: time-aware "Good morning/afternoon/
  evening, [name]." in Fraunces
- Safety Score widget ABOVE rooms list always
- Sidebar: sticky, always visible, never hides on scroll
- Room cards must show: type badge (formatted), 
  name, description max 2 lines, response count,
  status + close date separated by " · "
- NEVER concatenate status and date without separator
- Hover state on cards reveals quick actions:
  Copy Link, View Results, Close Room

### Create Room
- Multi-step flow with progress bar
- Step 1: room type, Step 2: name+dates, 
  Step 3: questions, Step 4: review
- Smooth slide animation between steps
- Custom date picker, never native browser input
- Questions are draggable cards with delete button

### Room Results
- Stats cards in bento layout with icons
- Room details go in Settings tab NOT Overview tab
- Overview tab shows sentiment heatmap and charts
- Submissions tab shows response cards with 
  colored left border matching reaction level
- Thread panel slides in from right

### Responder View (/r/[id])
- No navbar, no sidebar, completely clean
- One question at a time
- Textarea auto-grows, no resize handle
- Reaction slider: full gradient olive→yellow→terracotta
- Dynamic label updates as slider moves
- Slide transition between questions
- Beautiful thank you screen after submit

### Landing Page
- Hero CTAs need real button styling, not plain text
- All company names in marquee same cream color
- Watermark text opacity: 0.15
- Feature cards need backgrounds + icons
- How it works cards need backgrounds
- Free and Team pricing cards need #ede8dc background

### Settings
- Time-aware greeting
- All setting rows as proper cards with hover state
- Danger zone at bottom for delete account
- Plan indicator showing current plan

---

## 🐛 Known Bugs — Fix These First
1. Cards rendering with white/transparent background
2. "Open for responsesNo closing date" — missing 
   separator, fix to "Open for responses · No closing date"
3. Sidebar disappearing on scroll — make it sticky
4. Raw underscore room type labels everywhere
5. Landing page CTAs have no button styling
6. Safety score widget below rooms instead of above
7. Dashboard has hero/marketing section — remove it
8. Watermark covering headline on CTA section
9. Feature cards on landing page are empty
10. Pricing Free and Team cards have no background

---

## 🔒 Security Rules
- Never hardcode API keys or secrets
- Never commit .env files
- Always use environment variables for sensitive data
- Supabase keys only in .env.local

---

## 📁 File Structure Rules
- Components go in /components/[category]/
- Pages go in /app/[route]/
- Shared utilities go in /lib/utils/
- Types go in /types/index.ts
- Never put logic in page files, use components
- One component per file always

---

## ✅ Before Marking Any Task Done
- Check the browser — does it look right visually?
- Are all cards visible with #ede8dc background?
- Are all inputs visible with #faf7f2 background?
- Are room type labels formatted (no underscores)?
- Do all buttons have proper styling?
- Are animations smooth?
- Does it work on mobile?
- Fix anything that looks off before finishing.