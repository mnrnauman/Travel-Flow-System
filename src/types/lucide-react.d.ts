declare module 'lucide-react' {
  import type { FC, SVGProps, RefAttributes } from 'react'

  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number
    absoluteStrokeWidth?: boolean
    ref?: RefAttributes<SVGSVGElement>['ref']
  }

  export type LucideIcon = FC<LucideProps>

  export function createLucideIcon(iconName: string, iconNode: any): LucideIcon

  const icons: Record<string, LucideIcon>
  export default icons
  export = icons
}
