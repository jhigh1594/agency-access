'use client'

import Image from 'next/image'
import { Activity, ArrowRight, Files, Globe, Shield, GalleryVerticalEnd, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import DottedMap from 'dotted-map'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card } from '@/components/ui/card'
import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

export default function CombinedFeaturedSection() {
  const featuredCaseStudy = {
    company: 'Agency Access Platform',
    tags: 'Core Feature',
    title: 'One Link. Every Platform.',
    subtitle: 'Replace 30+ emails and 2-3 days of back-and-forth with a single 5-minute branded authorization link.',
  }

  return (
    <section className="py-24 sm:py-32 bg-white relative overflow-hidden">
      {/* Subtle warm mesh background */}
      <div className="absolute inset-0 bg-warm-mesh opacity-30 -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl sm:text-5xl tracking-tight mb-4">
            Trusted by Growing Agencies
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See how agencies are transforming client onboarding from a 3-day bottleneck to a 5-minute flow.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">

        {/* 1. ONE LINK EVERY PLATFORM - Top Left */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="clean-card p-6 flex flex-col bg-card"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Globe className="w-4 h-4" />
            <span className="font-semibold">Simplified Onboarding</span>
          </div>
          <h3 className="font-display text-xl text-foreground mb-2">
            One Link. Every Platform.
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Send clients a single branded authorization link. They connect Meta, Google, TikTok, and LinkedIn in one 5-minute flow.
          </p>

          {/* Platform badges */}
          <div className="flex flex-wrap gap-2 mb-2">
            {['Meta Ads', 'Google Ads', 'GA4', 'TikTok', 'LinkedIn'].map((platform, i) => (
              <span key={platform} className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/5 text-primary border border-primary/10">
                {platform}
              </span>
            ))}
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-3 gap-3 mt-auto">
            <div className="text-center p-3 rounded-xl bg-warm-gray/20 border border-border/50">
              <div className="text-2xl font-bold text-primary">30+</div>
              <div className="text-xs text-muted-foreground">Emails Eliminated</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-warm-gray/20 border border-border/50">
              <div className="text-2xl font-bold text-secondary">5 min</div>
              <div className="text-xs text-muted-foreground">Setup Time</div>
            </div>
            <div className="text-center p-3 rounded-xl bg-warm-gray/20 border border-border/50">
              <div className="text-2xl font-bold text-foreground">100%</div>
              <div className="text-xs text-muted-foreground">Completion</div>
            </div>
          </div>
        </motion.div>

        {/* 2. REAL-TIME ACTIVITY - Top Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="clean-card p-6 flex flex-col bg-card"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Activity className="w-4 h-4" />
            <span className="font-semibold">Live Activity Feed</span>
          </div>
          <h3 className="font-display text-xl text-foreground mb-2">
            Real-Time OAuth Events
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Watch agencies onboard clients in minutes. Token refreshes, new connections, platform integrations — all visible instantly.
          </p>

          <div className="flex-1 flex items-center justify-center">
            <AgencyActivityFeed />
          </div>
        </motion.div>

        {/* 3. CHART - Bottom Left - OAuth Analytics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="clean-card p-6 space-y-4 bg-card"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="w-4 h-4" />
              <span className="font-semibold">OAuth Analytics</span>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Growth Rate</div>
              <div className="text-sm font-bold text-secondary">+127%</div>
            </div>
          </div>
          <h3 className="font-display text-xl text-foreground">
            Client Onboarding Accelerated
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scale from 10 to 100 clients without adding headcount. Token health monitoring ensures 99.9% uptime.
          </p>
          
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Active OAuth Tokens</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-xs text-muted-foreground">New Authorizations</span>
            </div>
          </div>
          
          <MonitoringChart />
          
          {/* Bottom stats */}
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div>
              <div className="text-xs text-muted-foreground">Token Health</div>
              <div className="text-sm font-bold text-foreground">99.9% Uptime</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Auto-Refreshed</div>
              <div className="text-sm font-bold text-foreground">1,247 This Month</div>
            </div>
          </div>
        </motion.div>

        {/* 4. SECURITY - Bottom Right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="clean-card p-6 flex flex-col bg-card"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Shield className="w-4 h-4" />
            <span className="font-semibold">Enterprise Security</span>
          </div>
          <h3 className="font-display text-xl text-foreground mb-2">
            SOC 2 Compliant Token Storage
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            OAuth tokens encrypted in Infisical. Auto-refresh, complete audit logs, and zero password sharing ever.
          </p>

          {/* Key stats */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="p-3 rounded-xl bg-warm-gray/20 border border-border/50">
              <div className="text-xl font-bold text-secondary mb-1">SOC 2</div>
              <div className="text-xs text-muted-foreground">Type II Certified</div>
            </div>
            <div className="p-3 rounded-xl bg-warm-gray/20 border border-border/50">
              <div className="text-xl font-bold text-primary mb-1">99.9%</div>
              <div className="text-xs text-muted-foreground">Token Uptime</div>
            </div>
          </div>

          {/* Benefits list */}
          <ul className="space-y-2 mt-2">
            {[
              "Automatic token refresh before expiration",
              "Complete audit logging & compliance",
              "Never share passwords with clients",
              "Bank-grade encryption at rest"
            ].map((benefit, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{benefit}</span>
              </li>
            ))}
          </ul>
        </motion.div>
        </div>
      </div>
    </section>
  )
}

// ----------------- Feature Card Component -------------------
function FeatureCard({ icon, image, title, subtitle, description }: { icon: React.ReactNode, image: string, title: string, subtitle: string, description: string }) {
  return (
    <div className="relative clean-card p-5 flex flex-col gap-3 bg-card group overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3 text-muted-foreground">
          {icon}
          <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
        </div>
        <h3 className="font-display text-lg text-foreground">
          {subtitle}
        </h3>
        <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Image card pinned to bottom right */}
      <Card className="absolute bottom-0 right-0 w-24 h-20 sm:w-32 sm:h-28 md:w-40 md:h-32 border-8 border-r-0 border-b-0 rounded-tl-xl rounded-br-none rounded-tr-none rounded-bl-none overflow-hidden transition-transform duration-300 group-hover:scale-105">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          unoptimized
        />
      </Card>

      {/* Arrow icon on top of Card */}
      <div className="absolute bottom-2 right-2 p-2.5 flex items-center justify-center border border-border rounded-full hover:-rotate-45 hover:bg-primary hover:border-primary transition-all duration-300 z-10 bg-background shadow-sm">
        <ArrowRight className="w-4 h-4 text-foreground group-hover:text-white transition-colors" />
      </div>
    </div>
  )
}

// ----------------- Enhanced Feature Card Component -------------------
function EnhancedFeatureCard({ 
  icon, 
  title, 
  subtitle, 
  description, 
  benefits = [], 
  platformCount 
}: { 
  icon: React.ReactNode, 
  title: string, 
  subtitle: string, 
  description: string,
  benefits?: string[],
  platformCount?: string
}) {
  return (
    <div className="relative clean-card p-6 flex flex-col gap-4 bg-card group overflow-hidden h-full">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
          </div>
          {platformCount && (
            <span className="px-2 py-1 text-xs font-bold rounded-full bg-primary/5 text-primary border border-primary/10">
              {platformCount}
            </span>
          )}
        </div>
        <h3 className="font-display text-xl font-bold text-foreground mb-1">
          {title}
        </h3>
        <p className="text-sm font-semibold text-primary uppercase tracking-wide mb-2">
          {subtitle}
        </p>
        <p className="text-base text-muted-foreground leading-relaxed mb-4">
          {description}
        </p>
        
        {/* Benefits list */}
        {benefits.length > 0 && (
          <ul className="space-y-2">
            {benefits.map((benefit, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="w-1 h-1 rounded-full bg-secondary mt-1.5 flex-shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CTA arrow */}
      <div className="mt-auto pt-3 border-t border-border/50">
        <div className="flex items-center gap-2 text-sm font-bold text-primary group-hover:gap-3 transition-all">
          <span>Learn more</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}

// ----------------- Map -------------------
const map = new DottedMap({ height: 55, grid: 'diagonal' })
const points = map.getPoints()

const Map = () => (
  <svg viewBox="0 0 120 60" className="w-full h-auto text-primary/70 dark:text-white/30">
    {points.map((point, i) => (
      <circle key={i} cx={point.x} cy={point.y} r={0.15} fill="currentColor" />
    ))}
  </svg>
)

// ----------------- Chart -------------------
const chartData = [
  { month: 'May', active: 56, new: 224 },
  { month: 'June', active: 90, new: 300 },
  { month: 'July', active: 126, new: 252 },
  { month: 'Aug', active: 205, new: 410 },
  { month: 'Sep', active: 298, new: 386 },
  { month: 'Oct', active: 400, new: 520 },
]

const chartConfig = {
  active: {
    label: 'Active OAuth Connections',
    color: 'rgb(var(--primary))', // AuthHub Coral
  },
  new: {
    label: 'New Client Authorizations',
    color: 'rgb(var(--secondary))', // Teal
  },
} satisfies ChartConfig


function MonitoringChart() {
  return (
    <ChartContainer className="h-60 aspect-auto" config={chartConfig}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-active)" stopOpacity={0.7} />
            <stop offset="55%" stopColor="var(--color-active)" stopOpacity={0.05} />
          </linearGradient>
          <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-new)" stopOpacity={0.7} />
            <stop offset="55%" stopColor="var(--color-new)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <XAxis hide />
        <YAxis hide />
        <CartesianGrid vertical={false} horizontal={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area strokeWidth={2} dataKey="new" type="monotone" fill="url(#fillMobile)" stroke="var(--color-mobile)" />
        <Area strokeWidth={2} dataKey="active" type="monotone" fill="url(#fillDesktop)" stroke="var(--color-desktop)" />
      </AreaChart>
    </ChartContainer>
  )
}


interface Message {
  title: string;
  time: string;
  content: string;
  color: string;
}

const messages: Message[] = [
    {
      title: "Meta Ads Authorized",
      time: "1m ago",
      content: "Client connected Meta Ads account. OAuth token secured in Infisical.",
      color: "from-primary/80 to-primary/60",
    },
    {
      title: "Google Connected",
      time: "3m ago",
      content: "Google Ads & GA4 authorization completed. 3 ad accounts selected.",
      color: "from-secondary/80 to-secondary/60",
    },
    {
      title: "Token Auto-Refresh",
      time: "6m ago",
      content: "8 OAuth tokens refreshed before expiration. Zero downtime.",
      color: "from-orange-400/80 to-orange-500/60",
    },
    {
      title: "TikTok Integration",
      time: "10m ago",
      content: "New TikTok Ads connector added to agency workspace.",
      color: "from-pink-400/80 to-pink-500/60",
    },
    {
      title: "Access Request",
      time: "12m ago",
      content: "Client viewed your branded link. Started authorization flow.",
      color: "from-sky-400/80 to-blue-500/60",
    },
    {
      title: "Weekly Summary",
      time: "15m ago",
      content: "34 client onboards completed this week. Avg time: 4.2 minutes.",
      color: "from-emerald-400/80 to-emerald-500/60",
    },
  ];

const AgencyActivityFeed = () => {
  return (
    <div className="w-full max-w-sm h-[280px] bg-white p-3 overflow-hidden font-sans relative border border-border/40 rounded-2xl shadow-sm">
      {/* Fade shadow overlay */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent z-10"></div>
      
      <div className="space-y-2 relative z-0">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.15, duration: 0.4 }}
            className="flex gap-3 items-start p-3 border border-border/60 rounded-xl hover:border-primary/30 transition-colors cursor-pointer bg-card/50"
          >
            <div className={`w-8 h-8 min-w-[2rem] min-h-[2rem] rounded-lg bg-gradient-to-br ${msg.color} flex-shrink-0`} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                {msg.title}
                <span className="text-xs text-muted-foreground before:content-['•'] before:mr-1 flex-shrink-0">
                  {msg.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                {msg.content}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};


// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  )
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"]
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([_, config]) => config.theme || config.color,
  )

  if (!colorConfig.length) {
    return null
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color
    return color ? `  --color-${key}: ${color};` : null
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip as React.FC<RechartsPrimitive.TooltipProps<any, any>>

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  {
    active?: boolean
    payload?: Array<any>
    label?: React.ReactNode
    labelFormatter?: (label: any, payload: Array<any>) => React.ReactNode
    labelClassName?: string
    formatter?: (value: any, name: any, item: any, index: number, payload: any) => React.ReactNode
    color?: string
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  } & React.ComponentProps<"div">
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref,
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null
      }

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromPayload(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) {
        return null
      }

      return <div className={cn("font-medium", labelClassName)}>{value}</div>
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ])

    if (!active || !payload?.length) {
      return null
    }

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromPayload(config, item, key)
            const indicatorColor = color || item.payload.fill || item.color

            return (
              <div
                key={item.dataKey}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  formatter(item.value, item.name, item, index, item.payload)
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            },
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                      </div>
                      {item.value && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  },
)
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend as unknown as React.FC<RechartsPrimitive.LegendProps>

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    payload?: Array<any>
    verticalAlign?: 'top' | 'middle' | 'bottom'
    hideIcon?: boolean
    nameKey?: string
  }
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
    ref,
  ) => {
    const { config } = useChart()

    if (!payload?.length) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className,
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromPayload(config, item, key)

          return (
            <div
              key={item.value}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground",
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              {itemConfig?.label}
            </div>
          )
        })}
      </div>
    )
  },
)
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadObj = payload as Record<string, unknown>
  
  const payloadPayload =
    "payload" in payloadObj &&
    typeof payloadObj.payload === "object" &&
    payloadObj.payload !== null
      ? payloadObj.payload as Record<string, unknown>
      : undefined

  let configLabelKey: string = key

  if (
    key in payloadObj &&
    typeof payloadObj[key] === "string"
  ) {
    configLabelKey = payloadObj[key] as string
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key] as string
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key] as unknown as (typeof config)[keyof typeof config] | undefined
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}

