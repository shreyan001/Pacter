# 🚀 Quick Start - Testing Information Collection

## ✅ **What Was Fixed**

1. **Graph Routing** - Now loops correctly for information collection
2. **State Persistence** - Data no longer lost between messages
3. **Prompt Templates** - Better extraction and acknowledgment
4. **Progress Tracking** - Accurate field-based progress calculation
5. **Frontend Sync** - Graph state properly updates UI

---

## 🧪 **How to Test**

### **Step 1: Start the Dev Server**
```bash
yarn dev
```

### **Step 2: Navigate to Create Page**
```
http://localhost:3000/create
```

### **Step 3: Connect Your Wallet**
- Click "Connect Wallet" button
- Your wallet address will be automatically captured

### **Step 4: Start Conversation**

Try these test scenarios:

---

## 📝 **Test Scenario 1: Progressive Collection**

```
You: "I want to create an escrow"

AI: [Should move to collection stage]
    "Great! Let's create your escrow..."
    Progress: 10%
    
You: "Project name is Website Redesign"

AI: ✅ "Got it! Project: Website Redesign"
    "Now, what's the description?"
    Progress: ~23%
    
You: "Build a modern e-commerce website"

AI: ✅ "Perfect! Description saved"
    "What's your name?"
    Progress: ~37%
    
You: "John Doe"

AI: ✅ "Nice to meet you, John!"
    "What's your email?"
    Progress: ~50%
    
You: "john@example.com"

AI: ✅ "Email saved"
    "What's the payment amount in INR?"
    Progress: ~77%
    (Wallet already captured = ~63%)
    
You: "50000"

AI: ✅ "Excellent! All information collected!"
    [Shows complete summary with financial breakdown]
    Progress: 100%
```

---

## 📝 **Test Scenario 2: Bulk Information**

```
You: "I'm John Doe, email john@example.com, need a website for 50000 INR"

AI: ✅ "Excellent! I've captured:
    - Client Name: John Doe
    - Email: john@example.com
    - Payment: ₹50,000
    
    Now, what's the project name?"
    Progress: ~50%
    
You: "E-commerce Platform"

AI: ✅ "Got it! Project: E-commerce Platform"
    "Can you describe what needs to be built?"
    Progress: ~63%
    
You: "Modern online store with payment gateway"

AI: ✅ "Perfect! All information collected!"
    [Shows complete summary]
    Progress: 100%
```

---

## 📝 **Test Scenario 3: General Questions**

```
You: "What is Pacter?"

AI: [Should stay in initial stage]
    "Pacter is a trustless escrow platform..."
    [Provides detailed information]
    [INTENT:GENERAL] - conversation ends
    
You: "How does it work?"

AI: [Explains the process]
    [INTENT:GENERAL] - conversation ends
```

---

## 🔍 **What to Check**

### **1. Console Logs**
Open browser console (F12) and look for:
```
=== Graph Invocation ===
Input: [user message]
Wallet Address: [address]

=== Graph Result ===
Stage: information_collection
Operation: collect_initiator_info
Progress: 23
Collected Fields: { projectName: true, ... }

Collection progress: 1/6 fields collected (23%)
Routing from collect_initiator_info. Operation: collect_initiator_info
→ Staying in collect_initiator_info (need more data)
```

### **2. Progress Bar**
- Should start at 10% when collection begins
- Should increase with each field collected
- Should reach 100% when all 6 fields are collected

### **3. Stage Indicator**
- Stage 0: "Identity Selected" (initial)
- Stage 1: "Collecting Information" (during collection)
- Stage 2: "Information Complete" (processing)
- Stage 3: "Data Complete" (finished)

### **4. Field Tracking**
In the UI header, you should see:
- "Address Sent ✓" (if wallet connected)
- Progress percentage (e.g., "23%")

### **5. No Repeated Questions**
- AI should NEVER ask for information already provided
- Each question should be for a NEW missing field

### **6. State Persistence**
- Information should accumulate across messages
- Previously collected data should be preserved
- No data loss between messages

---

## 🐛 **Common Issues & Solutions**

### **Issue 1: Graph Ends Too Early**
**Symptom:** Conversation stops after first message
**Check:** Console logs for routing decisions
**Expected:** Should see "→ Staying in collect_initiator_info"

### **Issue 2: Data Not Persisting**
**Symptom:** AI asks for same information twice
**Check:** Console logs for "Collected Fields"
**Expected:** Should see fields marked as `true` once collected

### **Issue 3: Progress Not Updating**
**Symptom:** Progress bar stuck at 10%
**Check:** Console logs for "Collection progress"
**Expected:** Should see count increasing (1/6, 2/6, etc.)

### **Issue 4: Wallet Address Not Captured**
**Symptom:** AI asks for wallet address even when connected
**Check:** Console logs for "Wallet Address"
**Expected:** Should see your wallet address in logs

---

## 📊 **Expected State Flow**

```
Initial State:
{
  stage: 'initial',
  progress: 0,
  stageIndex: 0,
  collectedFields: all false
}
    ↓
After "I want escrow":
{
  stage: 'information_collection',
  progress: 10,
  stageIndex: 1,
  collectedFields: { walletAddress: true, others: false }
}
    ↓
After providing project name:
{
  stage: 'information_collection',
  progress: 23,
  stageIndex: 1,
  collectedFields: { projectName: true, walletAddress: true, others: false },
  projectInfo: { projectName: "Website Redesign" }
}
    ↓
... continues collecting ...
    ↓
After all 6 fields:
{
  stage: 'data_ready' → 'completed',
  progress: 100,
  stageIndex: 3,
  collectedFields: all true,
  projectInfo: { ... },
  clientInfo: { ... },
  financialInfo: { ... },
  formData: { complete JSON }
}
```

---

## ✅ **Success Checklist**

- [ ] Graph loops for information collection
- [ ] Progress bar updates correctly
- [ ] No repeated questions
- [ ] State persists across messages
- [ ] Wallet address auto-captured
- [ ] All 6 fields collected before completion
- [ ] Final summary displays correctly
- [ ] JSON data shown at the end
- [ ] Console logs show correct routing
- [ ] Frontend stages sync with graph state

---

## 🎯 **Next Steps After Testing**

Once information collection works:

1. **Contract Generation** - Use collected data to generate smart contract
2. **Signature Flow** - Implement dual-party signature collection
3. **Escrow Deployment** - Deploy escrow contract with collected terms
4. **0G Storage Integration** - Store contract data on 0G Storage
5. **Milestone Tracking** - Implement milestone verification flow

---

## 📞 **Need Help?**

Check these files for reference:
- `INFORMATION_COLLECTION_FIXES.md` - Detailed fix explanations
- `GRAPH_FLOW_DIAGRAM.md` - Visual flow diagrams
- `src/ai/graph.ts` - Graph implementation
- `src/components/create/CreateChat.tsx` - Frontend integration

---

**Happy Testing!** 🎉

The information collection flow should now work smoothly. Test it thoroughly and let me know if you encounter any issues!
