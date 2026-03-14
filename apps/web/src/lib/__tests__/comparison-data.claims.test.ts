import { describe, expect, it } from "vitest";
import { agencyAccessAlternativePage } from "@/lib/comparison-data";

describe("AgencyAccess comparison page claims", () => {
  it("uses the current AuthHub connector count in platform copy", () => {
    expect(agencyAccessAlternativePage.ourProduct.pricing.starter.features).toContain(
      "19 platform connectors",
    );
    expect(agencyAccessAlternativePage.pricingComparison.authhub.starter.features).toContain(
      "19 platform connectors",
    );
    expect(agencyAccessAlternativePage.ourProduct.platforms).toContain(
      "19 platform connectors",
    );

    expect(agencyAccessAlternativePage.ourProduct.pricing.starter.features).not.toContain(
      "8+ platform integrations",
    );
    expect(agencyAccessAlternativePage.pricingComparison.authhub.starter.features).not.toContain(
      "8+ platform integrations",
    );
    expect(agencyAccessAlternativePage.ourProduct.platforms).not.toContain(
      "8+ platform integrations",
    );
  });
});
