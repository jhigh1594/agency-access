/**
 * Instruction Generation Service Tests
 *
 * Tests for generating platform-specific authorization instructions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { instructionGenerationService } from '../instruction-generation.service.js';
import type { AccessLevel } from '@agency-platform/shared';

describe('InstructionGenerationService', () => {
  describe('generateInstructions', () => {
    const mockAgency = {
      name: 'Marketing Agency LLC',
      logoUrl: 'https://example.com/logo.png',
    };

    const mockAgencyIdentity = {
      email: 'agency@marketing.com',
      businessId: '123456789012345',
    };

    const mockAccessLevel: AccessLevel = 'standard';

    it('should generate Meta Ads instructions', () => {
      const result = instructionGenerationService.generateInstructions({
        platform: 'meta_ads',
        platformName: 'Meta Ads',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: mockAccessLevel,
        agency: mockAgency,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.platform).toBe('meta_ads');
      expect(result.data?.platformName).toBe('Meta Ads');
      expect(result.data?.steps).toBeDefined();
      expect(result.data?.steps.length).toBeGreaterThan(0);
      expect(result.data?.steps[0]).toHaveProperty('number');
      expect(result.data?.steps[0]).toHaveProperty('title');
      expect(result.data?.steps[0]).toHaveProperty('description');
      expect(result.data?.steps[0]).toHaveProperty('screenshotRef');
    });

    it('should include agency email in Google Ads instructions', () => {
      const result = instructionGenerationService.generateInstructions({
        platform: 'google_ads',
        platformName: 'Google Ads',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: mockAccessLevel,
        agency: mockAgency,
      });

      expect(result.error).toBeNull();
      expect(result.data?.steps).toBeDefined();

      // Find a step that should include the email
      const stepsText = result.data?.steps.map((s) => s.description).join(' ');
      expect(stepsText).toContain(mockAgencyIdentity.email);
    });

    it('should include business ID in Meta Ads instructions', () => {
      const result = instructionGenerationService.generateInstructions({
        platform: 'meta_ads',
        platformName: 'Meta Ads',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: mockAccessLevel,
        agency: mockAgency,
      });

      expect(result.error).toBeNull();
      expect(result.data?.steps).toBeDefined();

      // Find a step that should include the business ID
      const stepsText = result.data?.steps.map((s) => s.description).join(' ');
      expect(stepsText).toContain(mockAgencyIdentity.businessId);
    });

    it('should generate GA4 instructions', () => {
      const result = instructionGenerationService.generateInstructions({
        platform: 'ga4',
        platformName: 'Google Analytics 4',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: mockAccessLevel,
        agency: mockAgency,
      });

      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.platform).toBe('ga4');
      expect(result.data?.steps.length).toBeGreaterThan(0);
    });

    it('should include additional notes for Meta Ads', () => {
      const result = instructionGenerationService.generateInstructions({
        platform: 'meta_ads',
        platformName: 'Meta Ads',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: mockAccessLevel,
        agency: mockAgency,
      });

      expect(result.error).toBeNull();
      expect(result.data?.additionalNotes).toBeDefined();
      expect(Array.isArray(result.data?.additionalNotes)).toBe(true);
    });

    it('should return error for unsupported platform', () => {
      const result = instructionGenerationService.generateInstructions({
        platform: 'unsupported_platform' as any,
        platformName: 'Unsupported',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: mockAccessLevel,
        agency: mockAgency,
      });

      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('UNSUPPORTED_PLATFORM');
      expect(result.data).toBeNull();
    });

    it('should handle different access levels', () => {
      const adminResult = instructionGenerationService.generateInstructions({
        platform: 'meta_ads',
        platformName: 'Meta Ads',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: 'admin',
        agency: mockAgency,
      });

      const readOnlyResult = instructionGenerationService.generateInstructions({
        platform: 'meta_ads',
        platformName: 'Meta Ads',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: 'read_only',
        agency: mockAgency,
      });

      expect(adminResult.error).toBeNull();
      expect(readOnlyResult.error).toBeNull();

      // Both should generate instructions but with different permission descriptions
      expect(adminResult.data?.steps).toBeDefined();
      expect(readOnlyResult.data?.steps).toBeDefined();
    });

    it('should include screenshot URLs in steps', () => {
      const result = instructionGenerationService.generateInstructions({
        platform: 'meta_ads',
        platformName: 'Meta Ads',
        agencyIdentity: mockAgencyIdentity,
        accessLevel: mockAccessLevel,
        agency: mockAgency,
      });

      expect(result.error).toBeNull();

      const stepWithScreenshot = result.data?.steps.find((s) => s.screenshotUrl);
      expect(stepWithScreenshot).toBeDefined();
      expect(stepWithScreenshot?.screenshotUrl).toMatch(/^\/instructions\/screenshots\//);
    });
  });

  describe('getAccessLevelDescription', () => {
    it('should return correct description for admin level', () => {
      const result = instructionGenerationService.getAccessLevelDescription('admin');
      expect(result).toContain('manage');
      expect(result.toLowerCase()).toContain('full');
    });

    it('should return correct description for standard level', () => {
      const result = instructionGenerationService.getAccessLevelDescription('standard');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return correct description for read_only level', () => {
      const result = instructionGenerationService.getAccessLevelDescription('read_only');
      expect(result.toLowerCase()).toContain('view');
      expect(result).toContain('only');
    });

    it('should return correct description for email_only level', () => {
      const result = instructionGenerationService.getAccessLevelDescription('email_only');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
