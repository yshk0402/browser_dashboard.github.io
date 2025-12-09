import React from 'react';
import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

interface DynamicIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  // Access the icon from the LucideIcons namespace
  // @ts-ignore - Index signature for module is complex, simple access works here
  const IconComponent = (LucideIcons[name as keyof typeof LucideIcons] as LucideIcon) || LucideIcons.Link;

  return <IconComponent {...props} />;
};
