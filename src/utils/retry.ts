import { sleep } from './sleep';

export const retry = async <T>(fn: () => Promise<T>, retries = 2, delay = 100): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    else {
      await sleep(delay);
      return retry(fn, retries - 1);
    }
  }
};
