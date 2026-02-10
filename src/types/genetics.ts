// src/types/genetics.ts

import { Patient } from './index';

export interface GeneticResults {
  averageTelomereLength: string;
  estimatedBiologicalAge: string;
  agingDifference: number;
}

export interface TherapeuticResult {
  category: 'API' | 'Phytochemical' | 'Antioxidant' | 'Vitamine' | 'Mineral';
  items: string[];
}

export interface GeneralRecommendation {
  category: 'Nutrition' | 'Lifestyle';
  points: string[];
}

export interface ScientificReference {
  id: number;
  text: string;
  url: string;
}

export interface TelotestReport {
  patient: Pick<Patient, 'firstName' | 'lastName' | 'birthDate' | 'chronologicalAge'> & { customerCode: string };
  results: GeneticResults;
  interpretation: string;
  therapeuticResults: TherapeuticResult[];
  generalRecommendations: GeneralRecommendation[];
  references: ScientificReference[];
}

export interface GeneticTestRecord {
  id: string;
  patientId: string;
  chronologicalAge: number;
  averageTelomereLength: string;
  biologicalAge: number;
  differentialAge: number;
  interpretation?: string | null;
  therapeuticResults?: any;
  recommendations?: any;
  testDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

