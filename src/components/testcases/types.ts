import { TestCase as BaseTestCase } from '@/models/TestCase';

// Extender el tipo TestCase para añadir campos adicionales
export interface ExtendedTestCase extends BaseTestCase {
  observations?: string;
}

// Reexportar tipo parcial para usar en los componentes
export type PartialExtendedTestCase = Partial<ExtendedTestCase>;
