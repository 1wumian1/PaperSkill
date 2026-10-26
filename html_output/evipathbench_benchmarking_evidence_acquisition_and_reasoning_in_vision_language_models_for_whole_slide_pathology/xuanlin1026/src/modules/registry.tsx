import React from 'react';
import { ExampleSlider } from './exampleSlider';
import { Ana1 } from './ana-1';
import { Ana2 } from './ana-2';
import { Ana3 } from './ana-3';
import { Ana4 } from './ana-4';
import { Ana5 } from './ana-5';
import { Ana6 } from './ana-6';
import { HeroNew } from './hero-new';
import { HeroOld } from './hero-old';
import { M1_1 } from './m1-1';
import { M2_1 } from './m2-1';
import { M2_2 } from './m2-2';
import { M3_1 } from './m3-1';
import { M3_2 } from './m3-2';
import { M4_1 } from './m4-1';
import { M4_2 } from './m4-2';
import { M5_1 } from './m5-1';
import { M5_2 } from './m5-2';
import { M6_1 } from './m6-1';
import { M6_2 } from './m6-2';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};
widgetRegistry['example-slider'] = ExampleSlider;
widgetRegistry['ana-1'] = Ana1;
widgetRegistry['ana-2'] = Ana2;
widgetRegistry['ana-3'] = Ana3;
widgetRegistry['ana-4'] = Ana4;
widgetRegistry['ana-5'] = Ana5;
widgetRegistry['ana-6'] = Ana6;
widgetRegistry['hero-new'] = HeroNew;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['m1-1'] = M1_1;
widgetRegistry['m2-1'] = M2_1;
widgetRegistry['m2-2'] = M2_2;
widgetRegistry['m3-1'] = M3_1;
widgetRegistry['m3-2'] = M3_2;
widgetRegistry['m4-1'] = M4_1;
widgetRegistry['m4-2'] = M4_2;
widgetRegistry['m5-1'] = M5_1;
widgetRegistry['m5-2'] = M5_2;
widgetRegistry['m6-1'] = M6_1;
widgetRegistry['m6-2'] = M6_2;
