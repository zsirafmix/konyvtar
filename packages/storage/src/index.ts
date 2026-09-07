import { StorageProvider } from "./provider.interface";
import { LocalStorageProvider } from "./local.provider";
import { MegaStorageProvider } from "./mega.provider";

export * from "./provider.interface";
export * from "./local.provider";
export * from "./mega.provider";

export class StorageManager {
  private providers: Map<string, StorageProvider> = new Map();

  constructor() {
    this.register(new LocalStorageProvider());
    this.register(new MegaStorageProvider());
  }

  register(provider: StorageProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  getProvider(name = "local"): StorageProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      // Fallback to local
      return this.providers.get("local")!;
    }
    return provider;
  }
}

export const defaultStorageManager = new StorageManager();
