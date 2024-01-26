import winston from 'winston';

interface ServiceInstance {
  logger: winston.Logger | undefined;
}

export const ExceptionHandler =
  (shouldThrow = true, logArgs = false, returnValue?: any) =>
  (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): void => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: ServiceInstance, ...args: any[]): Promise<any> {
      try {
        return await originalMethod.apply(this, args);
      } catch (e: any) {
        if (this.logger) {
          const shortenedArgs = args.map((arg) => {
            const str = JSON.stringify(arg, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
            return str.length > 200 ? str.substring(0, 200) + '...' : str;
          });
          this.logger.error(`Error in ${propertyKey}: ${e.message}`, {
            stack: e.stack,
            ...(logArgs ? argsToObject(shortenedArgs) : {}),
          });
        }

        if (shouldThrow) throw e;
        else if (returnValue !== undefined) return returnValue;
      }
    };
  };

const argsToObject = (args: any[]): { [key: string]: any } => {
  return args.reduce((acc, curr, idx) => {
    acc[`arg${idx + 1}`] = JSON.stringify(curr ?? null);
    return acc;
  }, {});
};
