import { Module } from "@nestjs/common";
import { CacheFallbackService } from "./cache.fallback.js";
import { DefaultFallbackService } from "./default.fallback.js";

@Module({
  providers: [CacheFallbackService, DefaultFallbackService],
  exports: [CacheFallbackService, DefaultFallbackService],
})
export class FallbackModule {
  
}