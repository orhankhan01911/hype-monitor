import { motion } from 'framer-motion'

interface Props {
  isActive: boolean
  activeStep: number
}

const STEPS = [
  { label: 'Hyperliquid', sublabel: 'Funding Rate API', icon: '⬡' },
  { label: 'Vercel AI SDK', sublabel: 'generateObject()', icon: '◈' },
  { label: 'OpenRouter', sublabel: 'Model Gateway', icon: '⊕' },
  { label: 'Claude 3 Haiku', sublabel: 'LLM Inference', icon: '◉' },
  { label: 'Langfuse', sublabel: 'Trace Logged', icon: '✦' },
]

export function PipelineFlow({ isActive, activeStep }: Props) {
  return (
    <div className="p-5 bg-[#0d1117] rounded-lg border border-[#1e2736]">
      <p className="text-[#8B9EC7] text-xs font-mono tracking-widest uppercase mb-5">
        Request Pipeline
      </p>

      <div className="flex items-stretch gap-0">
        {STEPS.map((step, i) => {
          const isStepDone = activeStep > i
          const isStepActive = activeStep === i && isActive
          const stepColor = isStepDone || isStepActive ? '#00D4FF' : '#1e2736'

          return (
            <div key={step.label} className="flex items-center flex-1 min-w-0">
              <motion.div
                className="flex-1 min-w-0"
                animate={{ opacity: isStepDone || isStepActive ? 1 : 0.35 }}
                transition={{ duration: 0.3 }}
              >
                <div
                  className="text-center rounded border p-3 transition-all duration-300"
                  style={{
                    borderColor: stepColor,
                    background: isStepActive ? '#00D4FF12' : 'transparent',
                    boxShadow: isStepActive ? `0 0 12px #00D4FF20` : 'none',
                  }}
                >
                  <motion.div
                    className="text-lg mb-1 leading-none"
                    style={{ color: stepColor }}
                    animate={isStepActive ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.6, repeat: isStepActive ? Infinity : 0 }}
                  >
                    {step.icon}
                  </motion.div>
                  <p className="text-white text-[11px] font-mono truncate">{step.label}</p>
                  <p className="text-[#8B9EC7] text-[9px] font-mono mt-0.5 truncate">{step.sublabel}</p>
                </div>
              </motion.div>

              {i < STEPS.length - 1 && (
                <motion.div
                  className="w-4 h-px flex-shrink-0 mx-0.5"
                  animate={{
                    background: activeStep > i ? '#00D4FF' : '#1e2736',
                  }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-3 h-4 flex items-center justify-center">
        {isActive && activeStep < STEPS.length && (
          <motion.p
            key={activeStep}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[#00D4FF] text-[10px] font-mono"
          >
            ▸ {STEPS[activeStep]?.label} processing…
          </motion.p>
        )}
        {!isActive && activeStep >= STEPS.length && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[#00D4FF] text-[10px] font-mono"
          >
            ✓ Pipeline complete
          </motion.p>
        )}
      </div>
    </div>
  )
}
