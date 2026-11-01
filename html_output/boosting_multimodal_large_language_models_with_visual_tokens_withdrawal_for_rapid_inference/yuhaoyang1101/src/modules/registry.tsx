import React from 'react';
import { VtwAttentionLayers } from './vtw-attention-layers';
import { VtwBoundaryCases } from './vtw-boundary-cases';
import { VtwCover } from './vtw-cover';
import { VtwFlopsCheck } from './vtw-flops-check';
import { VtwInfoMigration } from './vtw-info-migration';
import { VtwKTradeoff } from './vtw-k-tradeoff';
import { VtwKlScan } from './vtw-kl-scan';
import { VtwKvCache } from './vtw-kv-cache';
import { VtwLatencyMemory } from './vtw-latency-memory';
import { VtwMmeSubtasks } from './vtw-mme-subtasks';
import { VtwOldHurdles } from './vtw-old-hurdles';
import { VtwPositionIds } from './vtw-position-ids';
import { VtwPrefillDecode } from './vtw-prefill-decode';
import { VtwQuestionPruning } from './vtw-question-pruning';
import { VtwTable1Ablation } from './vtw-table1-ablation';
import { VtwTable2Results } from './vtw-table2-results';
import { VtwTokenBill } from './vtw-token-bill';
import { VtwVerdictSort } from './vtw-verdict-sort';
import { VtwWithdrawTower } from './vtw-withdraw-tower';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['vtw-attention-layers'] = VtwAttentionLayers;
widgetRegistry['vtw-boundary-cases'] = VtwBoundaryCases;
widgetRegistry['vtw-cover'] = VtwCover;
widgetRegistry['vtw-flops-check'] = VtwFlopsCheck;
widgetRegistry['vtw-info-migration'] = VtwInfoMigration;
widgetRegistry['vtw-k-tradeoff'] = VtwKTradeoff;
widgetRegistry['vtw-kl-scan'] = VtwKlScan;
widgetRegistry['vtw-kv-cache'] = VtwKvCache;
widgetRegistry['vtw-latency-memory'] = VtwLatencyMemory;
widgetRegistry['vtw-mme-subtasks'] = VtwMmeSubtasks;
widgetRegistry['vtw-old-hurdles'] = VtwOldHurdles;
widgetRegistry['vtw-position-ids'] = VtwPositionIds;
widgetRegistry['vtw-prefill-decode'] = VtwPrefillDecode;
widgetRegistry['vtw-question-pruning'] = VtwQuestionPruning;
widgetRegistry['vtw-table1-ablation'] = VtwTable1Ablation;
widgetRegistry['vtw-table2-results'] = VtwTable2Results;
widgetRegistry['vtw-token-bill'] = VtwTokenBill;
widgetRegistry['vtw-verdict-sort'] = VtwVerdictSort;
widgetRegistry['vtw-withdraw-tower'] = VtwWithdrawTower;
