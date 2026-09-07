import { Injectable, Logger, Options } from "@nestjs/common";
import { CircuitBreakerOptions, CircuitBreakerState, CircuitBreakerStateEnum } from "./circuit-breaker.interface.js";

@Injectable()
export class CircuitBreakerService {
  private readonly logger: Logger = new Logger(CircuitBreakerService.name);
  private readonly circuits = new Map<string, CircuitBreakerState>();
  private readonly defaultOptions: CircuitBreakerOptions = {
    failureThreshold: 5,
    timeout: 60000,
    resetTimeout: 30000,
  };

  async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    key: string,
    fallback?: () => Promise<T>,
    options: CircuitBreakerOptions = this.defaultOptions,
  ) {
    const config = { ...this.defaultOptions, ...options };
    const circuit = this.getOrCreateCircuit(key, config);

    if (circuit.state === CircuitBreakerStateEnum.OPEN) {
      if (Date.now() < circuit.nextAttemptTime) {
        this.logger.warn(`Circuit is OPEN for key: ${key}. Returning fallback or throwing error.`);

        if (fallback) {
          return await fallback();
        }

        throw new Error(`Circuit is OPEN for key: ${key}. Operation not allowed.`);
      } else {
        circuit.state = CircuitBreakerStateEnum.HALF_OPEN;
        this.logger.warn(`Circuit is HALF_OPEN for key: ${key}. Allowing a trial operation.`);
      }
    }

    try {
      const result = await operation();

      this.onSuccess(circuit, key);

      return result;
    } catch (error: Error | any) {
      this.onFailure(circuit, key, config);
      this.logger.error(`Operation failed for key: ${key}. Error: ${error?.message}`);

      if (fallback) {
        this.logger.log(`Using fallback for key: ${key}.`);
        return await fallback();
      }

      throw error;
    }
  }

  private getOrCreateCircuit(key: string, config: CircuitBreakerOptions): CircuitBreakerState {
    const hasKeyCircuit = this.circuits.has(key);

    if (!hasKeyCircuit) {
      const newCircuit: CircuitBreakerState = {
        state: CircuitBreakerStateEnum.CLOSED,
        failureCount: 0,
        lastFailureTime: 0,
        nextAttemptTime: Date.now() + config.timeout,
      };

      this.circuits.set(key, newCircuit);
 
      return newCircuit;
    }

    return this.circuits.get(key) as CircuitBreakerState;
  }

  private onSuccess(circuit: CircuitBreakerState, key: string): void {
    circuit.failureCount = 0;
    circuit.state = CircuitBreakerStateEnum.CLOSED;
    this.logger.debug(`Circuit breaker SUCCESS for key: ${key}. Resetting failure count and state to CLOSED.`);
  }
  
  private onFailure(circuit: CircuitBreakerState, key: string, config: CircuitBreakerOptions): void {
    circuit.failureCount++;
    circuit.lastFailureTime = Date.now();

    if (circuit.failureCount >= config.failureThreshold) {
      circuit.state = CircuitBreakerStateEnum.OPEN;
      circuit.nextAttemptTime = Date.now() + config.resetTimeout;

      this.logger.warn(`Circuit breaker OPEN for key: ${key}. Failure count: ${circuit.failureCount}. Next attempt after: ${new Date(circuit.nextAttemptTime).toISOString()}`);
    }
  }

  getCircuitState(key: string): CircuitBreakerState | undefined {
    return this.circuits.get(key);
  }

  getAllCircuits(): Map<string, CircuitBreakerState> {
    return new Map(this.circuits);
  }

  resetCircuit(key: string): void {
    this.circuits.delete(key);
    this.logger.log(`Circuit breaker RESET for key: ${key}.`);
  }
}