import React from 'react';
import { CoverHearAll } from './cover-hear-all';
import { CoverRelay } from './cover-relay';
import { OrderCost } from './s01-order-cost';
import { PathLength } from './s02-path-length';
import { QkvScore } from './s03-qkv-score';
import { ScaleSoftmax } from './s04-scale-softmax';
import { AttentionMix } from './s05-attention-mix';
import { MultiheadSplit } from './s06-multihead-split';
import { PosEncoding } from './s08-pos-encoding';
import { CausalMask } from './s09-causal-mask';
import { ArchStack } from './s10-arch-stack';
import { BleuCost } from './s12-bleu-cost';
import { Limits } from './s13-limits';
import { Parsing } from './s14-parsing';
import { PosExtrapolate } from './s15-pos-extrapolate';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['cover-hear-all'] = CoverHearAll;
widgetRegistry['cover-relay'] = CoverRelay;
widgetRegistry['s01-order-cost'] = OrderCost;
widgetRegistry['s02-path-length'] = PathLength;
widgetRegistry['s03-qkv-score'] = QkvScore;
widgetRegistry['s04-scale-softmax'] = ScaleSoftmax;
widgetRegistry['s05-attention-mix'] = AttentionMix;
widgetRegistry['s06-multihead-split'] = MultiheadSplit;
widgetRegistry['s08-pos-encoding'] = PosEncoding;
widgetRegistry['s09-causal-mask'] = CausalMask;
widgetRegistry['s10-arch-stack'] = ArchStack;
widgetRegistry['s12-bleu-cost'] = BleuCost;
widgetRegistry['s13-limits'] = Limits;
widgetRegistry['s14-parsing'] = Parsing;
widgetRegistry['s15-pos-extrapolate'] = PosExtrapolate;
