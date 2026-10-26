import type { ComponentType } from 'react';
import { PassiveVsActiveLab } from '../components/PassiveVsActiveLab';
import { PassiveVsVStarHeroDemo } from '../components/PassiveVsVStarHeroDemo';
import { S2DecisionExperiment } from '../components/S2DecisionExperiment';
import { S3SearchExperiment } from '../components/S3SearchExperiment';
import { S4MemoryWorkbench } from '../components/S4MemoryWorkbench';
import { S5EvidenceJourney } from '../components/S5EvidenceJourney';
import { S6Synthesis } from '../components/S6Synthesis';

// The current App renders these components directly; this registry is the PaperSkill entry.
export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, ComponentType<WidgetProps>> = {};
widgetRegistry['vstar-passive-active'] = PassiveVsActiveLab;
widgetRegistry['vstar-hero'] = PassiveVsVStarHeroDemo;
widgetRegistry['vstar-s2-decision'] = S2DecisionExperiment;
widgetRegistry['vstar-s3-search'] = S3SearchExperiment;
widgetRegistry['vstar-s4-memory'] = S4MemoryWorkbench;
widgetRegistry['vstar-s5-evidence'] = S5EvidenceJourney;
widgetRegistry['vstar-s6-synthesis'] = S6Synthesis;
