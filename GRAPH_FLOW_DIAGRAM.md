# Information Collection Graph Flow

## 📊 **Visual Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────┐
│                          START                                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  initial_node  │
                    │                │
                    │ • Greet user   │
                    │ • Classify     │
                    │   intent       │
                    └────────┬───────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            [INTENT:GENERAL]   [INTENT:ESCROW]
                    │                 │
                    ▼                 ▼
                  ┌───┐      ┌──────────────────┐
                  │END│      │collect_initiator │
                  └───┘      │     _info        │◄─────┐
                             │                  │      │
                             │ • Extract data   │      │
                             │ • Update state   │      │
                             │ • Check count    │      │
                             └────────┬─────────┘      │
                                      │                │
                             ┌────────┴────────┐       │
                             │                 │       │
                    collectedCount < 6   collectedCount = 6
                             │                 │       │
                             │                 │       │
                      [collect_more]    [request_missing_info]
                             │                 │       │
                             └─────────────────┘       │
                                      LOOP              │
                                                        ▼
                                              ┌──────────────────┐
                                              │request_missing   │
                                              │     _info        │
                                              │                  │
                                              │ • Calculate fees │
                                              │ • Generate JSON  │
                                              │ • Display data   │
                                              └────────┬─────────┘
                                                       │
                                                       ▼
                                                    ┌───┐
                                                    │END│
                                                    └───┘
```

---

## 🔄 **State Transitions**

### **Initial Stage**
```
State: {
  stage: 'initial',
  progress: 0,
  stageIndex: 0,
  currentFlowStage: 'Identity Selected'
}
```

### **Collection Stage (Loop)**
```
State: {
  stage: 'information_collection',
  progress: 10-90 (based on fields collected),
  stageIndex: 1,
  currentFlowStage: 'Collecting Information',
  collectedFields: {
    projectName: true/false,
    projectDescription: true/false,
    clientName: true/false,
    email: true/false,
    walletAddress: true/false,
    paymentAmount: true/false
  }
}
```

### **Final Processing Stage**
```
State: {
  stage: 'data_ready' → 'completed',
  progress: 100,
  stageIndex: 2 → 3,
  currentFlowStage: 'Data Complete',
  isStageComplete: true,
  formData: { /* complete project data */ }
}
```

---

## 🎯 **Field Collection Progress**

```
0/6 fields → Progress: 10%  → "Let's get started!"
1/6 fields → Progress: 23%  → "Great start!"
2/6 fields → Progress: 37%  → "Making progress!"
3/6 fields → Progress: 50%  → "Halfway there!"
4/6 fields → Progress: 63%  → "Almost done!"
5/6 fields → Progress: 77%  → "Just one more!"
6/6 fields → Progress: 90%  → "Processing..." → 100% "Complete!"
```

---

## 💬 **Conversation Example**

```
┌─────────────────────────────────────────────────────────────┐
│ USER: "Hi, I want to hire a freelancer"                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AI: [INTENT:ESCROW detected]                                │
│ "Great! Let's create your escrow. What's the project name?" │
│                                                              │
│ State: stage='information_collection', progress=10%         │
│ collectedFields: all false                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ USER: "Website Redesign"                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AI: ✅ "Got it! Project: Website Redesign"                  │
│ "Now, can you describe what needs to be built?"             │
│                                                              │
│ State: progress=23%                                          │
│ collectedFields: { projectName: true, ... }                 │
│ projectInfo: { projectName: "Website Redesign" }            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ USER: "Modern e-commerce site with payment integration"     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AI: ✅ "Perfect! Description saved."                        │
│ "What's your name?"                                          │
│                                                              │
│ State: progress=37%                                          │
│ collectedFields: { projectName: true, projectDesc: true }   │
└─────────────────────────────────────────────────────────────┘
                            ↓
                    ... continues ...
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ USER: "50000 INR"                                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ AI: ✅ "Excellent! All information collected!"              │
│                                                              │
│ 📋 Project Summary:                                          │
│ • Project: Website Redesign                                  │
│ • Client: John Doe                                           │
│ • Email: john@example.com                                    │
│ • Payment: ₹50,000 INR                                       │
│ • Platform Fee: ₹1,250                                       │
│ • Total Escrow: ₹51,750                                      │
│                                                              │
│ State: stage='completed', progress=100%                      │
│ formData: { /* complete JSON */ }                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Key Mechanisms**

### **1. Self-Loop for Collection**
```typescript
// Instead of ending, loop back to collect more
"collect_more": "collect_initiator_info"
```

### **2. Progress Calculation**
```typescript
const collectedCount = Object.values(collectedFields).filter(Boolean).length;
const progress = Math.round((collectedCount / 6) * 80) + 10; // 10-90%
```

### **3. Completion Check**
```typescript
if (collectedCount === 6) {
    operation = "request_missing_info";
    nextStage = 'data_ready';
    isComplete = true;
}
```

### **4. State Preservation**
```typescript
// Always spread existing state
updatedState.projectInfo = { 
    ...updatedState.projectInfo,  // ← Keep existing data
    ...(extracted.projectName && { projectName: extracted.projectName })
};
```

---

## 🎨 **Frontend Synchronization**

```
Graph State                    Frontend Display
─────────────────────────────────────────────────────────────
stage: 'initial'          →    Stage 0: "Identity Selected"
progress: 0%              →    Progress Bar: 0%

stage: 'information_      →    Stage 1: "Collecting Info"
       collection'
progress: 23%             →    Progress Bar: 23%
collectedFields: {...}    →    Field indicators: ✅/❌

stage: 'data_ready'       →    Stage 2: "Processing..."
progress: 90%             →    Progress Bar: 90%

stage: 'completed'        →    Stage 3: "Complete!"
progress: 100%            →    Progress Bar: 100%
formData: {...}           →    Display JSON contract
```

---

## ✅ **Success Criteria**

- ✅ Graph loops until all 6 fields collected
- ✅ State persists across messages
- ✅ Progress updates correctly
- ✅ No duplicate questions
- ✅ Acknowledges each input
- ✅ Moves to final processing only when complete
- ✅ Frontend stays in sync with graph state

---

**The information collection flow is now fully functional!** 🎉
