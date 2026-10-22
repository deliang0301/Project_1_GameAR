export type GameLevel = 'intro' | 'level1' | 'level2' | 'level3_quiz' | 'victory';

export interface HardwarePart {
  id: 'cpu' | 'ram' | 'gpu' | 'ssd' | 'cooler' | 'psu';
  name: string;
  category: string;
  roleIndo: string;
  description: string;
  analogy: string;
  specText: string;
  installed: boolean;
  color: string;
  accentColor: string;
  iconName: string;
}

export interface VirusEntity {
  id: string;
  type: 'trojan' | 'ransomware' | 'phishing' | 'worm' | 'spyware';
  name: string;
  dangerLevel: 'Sedang' | 'Tinggi' | 'Kritis';
  description: string;
  preventionTip: string;
  x: number;
  y: number;
  z: number;
  hp: number;
  maxHp: number;
  color: number;
  speed: number;
  phase: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
