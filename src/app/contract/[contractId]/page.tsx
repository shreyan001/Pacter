'use client'

import React from 'react'
import { Button } from "@/components/ui/button"
import { ArrowLeft, Github, Globe } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ContractPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>

        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <div className="flex gap-4">
                <Github className="w-12 h-12 text-gray-600 dark:text-gray-400" />
                <Globe className="w-12 h-12 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              New Verification System Coming Soon
            </h1>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              We're transitioning from smart contract deployments to a more advanced 
              GitHub and web development verification system.
            </p>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                What's Coming:
              </h3>
              <ul className="text-left text-blue-800 dark:text-blue-200 space-y-1">
                <li>• GitHub repository verification</li>
                <li>• Web development project validation</li>
                <li>• Advanced code quality checks</li>
                <li>• Automated testing integration</li>
              </ul>
            </div>
            
            <Button 
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Return to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}