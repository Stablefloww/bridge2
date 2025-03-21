import 'jest';

declare global {
  const jest: typeof import('jest');
  namespace jest {
    interface Matchers<R> {
      toBeValid(): R;
    }
  }
} 