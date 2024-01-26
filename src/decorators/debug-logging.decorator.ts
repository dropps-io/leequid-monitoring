import winston from 'winston';

interface ServiceInstance {
  logger: winston.Logger | undefined;
}

export const DebugLogger =
  () =>
  (target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>): void => {
    const originalMethod = descriptor.value;

    descriptor.value = function (this: ServiceInstance, ...args: any[]): any {
      if (this.logger) {
        const shortenedArgs = args.map((arg) => {
          const str = JSON.stringify(arg, (_, v) => (typeof v === 'bigint' ? v.toString() : v));
          return str && str.length > 200 ? str.substring(0, 200) + '...' : str;
        });
        this.logger.debug(`Called ${propertyKey} with arguments: ${JSON.stringify(shortenedArgs)}`);
      }
      return originalMethod.apply(this, args);
    };
  };
