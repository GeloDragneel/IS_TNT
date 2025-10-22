// iconMapper.ts
import * as Icons from 'lucide-react';

export const getIcon = (iconName: string) => {
  const IconComponent = Icons[iconName as keyof typeof Icons];
  return IconComponent || Icons.Circle; // Fallback if not found
};
