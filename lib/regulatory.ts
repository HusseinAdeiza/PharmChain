export type RegistryId = "nafdac" | "fda-ndc";
export type JurisdictionCode = "NG" | "US";

export type RegulatoryKey = {
  registry: RegistryId;
  jurisdiction: JurisdictionCode;
  registrationId: string;
  canonicalKey: string;
  chainLookupKey?: string;
};

const registryConfig: Record<RegistryId, { jurisdiction: JurisdictionCode; label: string }> = {
  nafdac: { jurisdiction: "NG", label: "NAFDAC · Nigeria" },
  "fda-ndc": { jurisdiction: "US", label: "US FDA NDC · United States" },
};

export function registryLabel(registry: RegistryId) {
  return registryConfig[registry].label;
}

export function defaultRegistry(): RegistryId {
  return "nafdac";
}

export function createRegulatoryKey(registry: RegistryId, registrationId: string): RegulatoryKey {
  const normalizedId = registrationId.trim();
  const jurisdiction = registryConfig[registry].jurisdiction;
  return {
    registry,
    jurisdiction,
    registrationId: normalizedId,
    canonicalKey: `${registry}:${jurisdiction}:${normalizedId}`,
    chainLookupKey: registry === "nafdac" ? normalizedId : undefined,
  };
}

export function parseRegulatoryKey(value: string): RegulatoryKey {
  const input = value.trim();
  const segments = input.split(":");
  if (segments.length === 3) {
    const registry = segments[0]?.toLowerCase();
    const jurisdiction = segments[1]?.toUpperCase();
    const registrationId = segments.slice(2).join(":").trim();
    if ((registry === "nafdac" || registry === "fda-ndc") && registrationId) {
      const expected = registryConfig[registry].jurisdiction;
      if (!jurisdiction || jurisdiction === expected) {
        return createRegulatoryKey(registry, registrationId);
      }
    }
  }
  return createRegulatoryKey("nafdac", input);
}

export function isRegistryId(value: string): value is RegistryId {
  return value === "nafdac" || value === "fda-ndc";
}
