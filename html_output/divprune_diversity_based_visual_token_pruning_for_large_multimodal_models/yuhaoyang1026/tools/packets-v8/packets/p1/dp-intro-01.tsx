import React from 'react';
import type { WidgetProps } from './registry';
import { DpIntro } from './dp-intro';

// 第 1 章开场页：测绘队情节 + 三层阅读（内容见 dp-intro.tsx）。
export const DpIntro01: React.FC<WidgetProps> = () => <DpIntro k="01" />;
