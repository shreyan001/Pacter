'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { contractsByKey, type ContractKey, type DeployableContractMetadata } from '@/lib/contractCompile'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { AlertTriangle, Check, Code as CodeIcon, Copy, FileText, Layers, List, Shield } from 'lucide-react'

type CopyTarget = 'code' | 'abi' | 'bytecode'

interface DeployableContractPanelProps {
  contractKey?: ContractKey
  contract?: DeployableContractMetadata
  className?: string
}

interface SectionHeaderProps {
  icon: ReactNode
  title: string
  description?: string
}

function SectionHeader({ icon, title, description }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {icon}
        <span>{title}</span>
      </div>
      {description ? <p className="text-sm text-muted-foreground/80">{description}</p> : null}
    </div>
  )
}

export function DeployableContractPanel({ contractKey, contract: contractOverride, className }: DeployableContractPanelProps) {
  const contract = useMemo<DeployableContractMetadata | undefined>(() => {
    if (contractOverride) return contractOverride
    if (contractKey) return contractsByKey[contractKey]
    return undefined
  }, [contractKey, contractOverride])

  const [expandedSections, setExpandedSections] = useState<Record<CopyTarget, boolean>>({
    code: false,
    abi: false,
    bytecode: false
  })

  const [copyState, setCopyState] = useState<Record<CopyTarget, boolean>>({
    code: false,
    abi: false,
    bytecode: false
  })

  if (!contract) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle>Contract unavailable</CardTitle>
          <CardDescription>Select a valid contract artifact to continue.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const toggleSection = (section: CopyTarget) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleCopy = (section: CopyTarget, value: string | undefined) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopyState((prev) => ({
      ...prev,
      [section]: true
    }))
    setTimeout(() => {
      setCopyState((prev) => ({
        ...prev,
        [section]: false
      }))
    }, 1800)
  }

  const formattedSecurityScore = contract.solidityScanResults.securityScore.toFixed(2)
  const formattedThreatScore = contract.solidityScanResults.threatScore.toFixed(2)
  const abiDisplay = contract.abi && contract.abi.length > 0 ? JSON.stringify(contract.abi, null, 2) : contract.abiNote ?? 'ABI will be provided after compilation.'
  const bytecodeDisplay = contract.bytecode && contract.bytecode.length > 0 ? contract.bytecode : contract.bytecodeNote ?? 'Bytecode will be populated after compilation.'
  const abiCopyValue = contract.abi && contract.abi.length > 0 ? JSON.stringify(contract.abi, null, 2) : undefined
  const bytecodeCopyValue = contract.bytecode && contract.bytecode.length > 0 ? contract.bytecode : undefined

  return (
    <Card className={cn('w-full space-y-6', className)}>
      <CardHeader className="space-y-4">
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold">{contract.name}</CardTitle>
          <CardDescription className="text-base">{contract.summary}</CardDescription>
        </div>
        {contract.highlightTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {contract.highlightTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
        <div className="text-sm text-muted-foreground/80">
          {contract.description}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
            <SectionHeader icon={<Shield className="h-4 w-4" />} title="Security score" description={contract.solidityScanResults.securityScoreComments} />
            <p className="mt-3 text-3xl font-bold text-foreground">{formattedSecurityScore}</p>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
            <SectionHeader icon={<AlertTriangle className="h-4 w-4" />} title="Threat score" description={contract.solidityScanResults.securityScanComments} />
            <p className="mt-3 text-3xl font-bold text-foreground">{formattedThreatScore}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <SectionHeader icon={<Layers className="h-4 w-4" />} title="Constructor parameters" description={`Solidity ${contract.solidityVersion}`} />
            <div className="space-y-3">
              {contract.constructorArgs.map((arg) => (
                <div key={arg.name} className="rounded-md border border-border/60 bg-muted/5 p-3">
                  <div className="flex items-center justify-between text-sm font-semibold text-foreground">
                    <span>{arg.name}</span>
                    <span className="text-muted-foreground">{arg.type}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{arg.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <SectionHeader icon={<List className="h-4 w-4" />} title="Deployment checklist" />
            <ol className="space-y-3 text-sm text-muted-foreground">
              {contract.deploymentChecklist.map((item, index) => (
                <li key={item.title} className="rounded-md border border-border/60 bg-muted/5 p-3">
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-xs font-semibold text-muted-foreground/80">{index + 1}.</span>
                    <span>
                      <span className="font-medium text-foreground">{item.title}</span>
                      {item.note ? <span className="block text-muted-foreground/80">{item.note}</span> : null}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {contract.dependencies && contract.dependencies.length > 0 ? (
          <div className="space-y-3">
            <SectionHeader icon={<FileText className="h-4 w-4" />} title="External dependencies" />
            <ul className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              {contract.dependencies.map((dependency) => (
                <li key={dependency.label} className="rounded-md border border-border/60 bg-muted/5 px-3 py-1.5">
                  <span className="font-semibold text-foreground">{dependency.label}</span>
                  {dependency.path ? <span className="ml-2 text-muted-foreground/80">{dependency.path}</span> : null}
                  {dependency.description ? <span className="ml-2 text-muted-foreground/60">{dependency.description}</span> : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {contract.recommendedUseCases.length > 0 ? (
          <div className="space-y-3">
            <SectionHeader icon={<FileText className="h-4 w-4" />} title="Recommended use cases" />
            <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              {contract.recommendedUseCases.map((useCase) => (
                <li key={useCase} className="rounded-md border border-border/60 bg-muted/5 p-3 text-foreground">
                  {useCase}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <SectionHeader icon={<FileText className="h-4 w-4" />} title="Lifecycle stages" />
            <ul className="space-y-3 text-sm text-muted-foreground">
              {contract.lifecycleStages.map((stage) => (
                <li key={stage.title} className="rounded-md border border-border/60 bg-muted/5 p-3">
                  <p className="font-medium text-foreground">{stage.title}</p>
                  <p className="mt-1 text-muted-foreground/80">{stage.description}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <SectionHeader icon={<List className="h-4 w-4" />} title="Runtime functions" />
            <ul className="space-y-3 text-sm text-muted-foreground">
              {contract.runtimeFunctions.map((fn) => (
                <li key={fn.name} className="rounded-md border border-border/60 bg-muted/5 p-3">
                  <p className="font-medium text-foreground">{fn.name}</p>
                  <p className="mt-1 text-muted-foreground/80">{fn.description}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {contract.monitoringNotes && contract.monitoringNotes.length > 0 ? (
          <div className="space-y-3">
            <SectionHeader icon={<List className="h-4 w-4" />} title="Monitoring notes" />
            <ul className="space-y-2 text-sm text-muted-foreground">
              {contract.monitoringNotes.map((note) => (
                <li key={note} className="rounded-md border border-border/60 bg-muted/5 p-3 text-foreground">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-4">
          <SectionHeader icon={<CodeIcon className="h-4 w-4" />} title="Compiled artifacts" />

          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Contract source</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleSection('code')}>
                  {expandedSections.code ? 'Hide source' : 'Show source'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy('code', contract.contractCode)}
                  disabled={!contract.contractCode}
                  className="flex items-center gap-2"
                >
                  {copyState.code ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copyState.code ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            {expandedSections.code ? (
              <ScrollArea className="h-72 rounded-md border border-border/60 bg-background/60 p-4">
                <pre className="whitespace-pre text-sm leading-relaxed text-foreground/90">{contract.contractCode}</pre>
              </ScrollArea>
            ) : null}
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">ABI</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleSection('abi')}>
                  {expandedSections.abi ? 'Hide ABI' : 'Show ABI'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy('abi', abiCopyValue)}
                  disabled={!abiCopyValue}
                  className="flex items-center gap-2"
                >
                  {copyState.abi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copyState.abi ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            {expandedSections.abi ? (
              <ScrollArea className="h-64 rounded-md border border-border/60 bg-background/60 p-4">
                <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground/90">{abiDisplay}</pre>
              </ScrollArea>
            ) : null}
          </div>

          <div className="space-y-4 rounded-lg border border-border/60 bg-muted/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Bytecode</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => toggleSection('bytecode')}>
                  {expandedSections.bytecode ? 'Hide bytecode' : 'Show bytecode'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy('bytecode', bytecodeCopyValue)}
                  disabled={!bytecodeCopyValue}
                  className="flex items-center gap-2"
                >
                  {copyState.bytecode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copyState.bytecode ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
            {expandedSections.bytecode ? (
              <ScrollArea className="h-52 rounded-md border border-border/60 bg-background/60 p-4">
                <pre className="whitespace-pre-wrap break-words text-xs leading-relaxed text-foreground/90">{bytecodeDisplay}</pre>
              </ScrollArea>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
