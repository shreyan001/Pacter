const contractId = 'contract_1759920742668'

async function checkState() {
  const response = await fetch(`http://localhost:3000/api/contracts?id=${contractId}`)
  const contract = await response.json()
  
  console.log('Current Stage:', contract.currentStage)
  console.log('Milestone Status:', contract.milestones?.[0]?.status)
  console.log('Payment Approved:', contract.milestones?.[0]?.payment?.approved)
  console.log('Storage Hash:', contract.milestones?.[0]?.deliverable?.storage?.storageHash)
  console.log('Deployment URL:', contract.milestones?.[0]?.deliverable?.deploymentUrl)
}

checkState()
