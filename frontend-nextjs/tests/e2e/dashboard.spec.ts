import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display the main dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Check if the main title is visible
    await expect(page.getByText('VantagePoint')).toBeVisible();
    
    // Check if the sidebar is visible
    await expect(page.getByText('Home')).toBeVisible();
    await expect(page.getByText('Leads')).toBeVisible();
    await expect(page.getByText('Users')).toBeVisible();
    
    // Check if metrics are displayed
    await expect(page.getByText('Practices Signed Up')).toBeVisible();
    await expect(page.getByText('Active Leads')).toBeVisible();
    await expect(page.getByText('Conversion Rate')).toBeVisible();
    await expect(page.getByText('Total Leads')).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    await page.goto('/');
    
    // Click on Leads in sidebar
    await page.getByText('Leads').click();
    // Add assertions for leads page
    
    // Click on Users in sidebar
    await page.getByText('Users').click();
    // Add assertions for users page
  });

  test('should display the data table', async ({ page }) => {
    await page.goto('/');
    
    // Check if the data table is visible
    await expect(page.getByText('Recent Leads')).toBeVisible();
    
    // Check if table headers are present
    await expect(page.getByText('Practice')).toBeVisible();
    await expect(page.getByText('Owner')).toBeVisible();
    await expect(page.getByText('Email')).toBeVisible();
    await expect(page.getByText('Phone')).toBeVisible();
    await expect(page.getByText('Priority')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if the page is still functional on mobile
    await expect(page.getByText('VantagePoint')).toBeVisible();
    
    // Check if sidebar collapses on mobile
    // Add mobile-specific assertions
  });
});
