#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = __importStar(require("aws-cdk-lib"));
const infrastructure_stack_1 = require("../lib/infrastructure-stack");
const app = new cdk.App();
// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || 'dev';
const domainName = app.node.tryGetContext('domainName');
// Development environment
new infrastructure_stack_1.VantagePointStack(app, `VantagePoint-${environment}`, {
    environment,
    domainName,
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
    },
    tags: {
        Environment: environment,
        Application: 'VantagePoint',
        ManagedBy: 'CDK',
    },
});
// Production environment (commented out - uncomment when ready)
// new VantagePointStack(app, 'VantagePoint-production', {
//   environment: 'production',
//   domainName: 'your-domain.com',
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: 'us-east-1',
//   },
//   tags: {
//     Environment: 'production',
//     Application: 'VantagePoint',
//     ManagedBy: 'CDK',
//   },
// });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5mcmFzdHJ1Y3R1cmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmZyYXN0cnVjdHVyZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLGlEQUFtQztBQUNuQyxzRUFBZ0U7QUFFaEUsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFFMUIsbURBQW1EO0FBQ25ELE1BQU0sV0FBVyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEtBQUssQ0FBQztBQUNuRSxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUV4RCwwQkFBMEI7QUFDMUIsSUFBSSx3Q0FBaUIsQ0FBQyxHQUFHLEVBQUUsZ0JBQWdCLFdBQVcsRUFBRSxFQUFFO0lBQ3hELFdBQVc7SUFDWCxVQUFVO0lBQ1YsR0FBRyxFQUFFO1FBQ0gsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CO1FBQ3hDLE1BQU0sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixJQUFJLFdBQVc7S0FDdEQ7SUFDRCxJQUFJLEVBQUU7UUFDSixXQUFXLEVBQUUsV0FBVztRQUN4QixXQUFXLEVBQUUsY0FBYztRQUMzQixTQUFTLEVBQUUsS0FBSztLQUNqQjtDQUNGLENBQUMsQ0FBQztBQUVILGdFQUFnRTtBQUNoRSwwREFBMEQ7QUFDMUQsK0JBQStCO0FBQy9CLG1DQUFtQztBQUNuQyxXQUFXO0FBQ1gsZ0RBQWdEO0FBQ2hELDJCQUEyQjtBQUMzQixPQUFPO0FBQ1AsWUFBWTtBQUNaLGlDQUFpQztBQUNqQyxtQ0FBbUM7QUFDbkMsd0JBQXdCO0FBQ3hCLE9BQU87QUFDUCxNQUFNIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFZhbnRhZ2VQb2ludFN0YWNrIH0gZnJvbSAnLi4vbGliL2luZnJhc3RydWN0dXJlLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8gR2V0IGVudmlyb25tZW50IGZyb20gY29udGV4dCBvciBkZWZhdWx0IHRvICdkZXYnXG5jb25zdCBlbnZpcm9ubWVudCA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2Vudmlyb25tZW50JykgfHwgJ2Rldic7XG5jb25zdCBkb21haW5OYW1lID0gYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZG9tYWluTmFtZScpO1xuXG4vLyBEZXZlbG9wbWVudCBlbnZpcm9ubWVudFxubmV3IFZhbnRhZ2VQb2ludFN0YWNrKGFwcCwgYFZhbnRhZ2VQb2ludC0ke2Vudmlyb25tZW50fWAsIHtcbiAgZW52aXJvbm1lbnQsXG4gIGRvbWFpbk5hbWUsXG4gIGVudjoge1xuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXG4gICAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ3VzLWVhc3QtMScsXG4gIH0sXG4gIHRhZ3M6IHtcbiAgICBFbnZpcm9ubWVudDogZW52aXJvbm1lbnQsXG4gICAgQXBwbGljYXRpb246ICdWYW50YWdlUG9pbnQnLFxuICAgIE1hbmFnZWRCeTogJ0NESycsXG4gIH0sXG59KTtcblxuLy8gUHJvZHVjdGlvbiBlbnZpcm9ubWVudCAoY29tbWVudGVkIG91dCAtIHVuY29tbWVudCB3aGVuIHJlYWR5KVxuLy8gbmV3IFZhbnRhZ2VQb2ludFN0YWNrKGFwcCwgJ1ZhbnRhZ2VQb2ludC1wcm9kdWN0aW9uJywge1xuLy8gICBlbnZpcm9ubWVudDogJ3Byb2R1Y3Rpb24nLFxuLy8gICBkb21haW5OYW1lOiAneW91ci1kb21haW4uY29tJyxcbi8vICAgZW52OiB7XG4vLyAgICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcbi8vICAgICByZWdpb246ICd1cy1lYXN0LTEnLFxuLy8gICB9LFxuLy8gICB0YWdzOiB7XG4vLyAgICAgRW52aXJvbm1lbnQ6ICdwcm9kdWN0aW9uJyxcbi8vICAgICBBcHBsaWNhdGlvbjogJ1ZhbnRhZ2VQb2ludCcsXG4vLyAgICAgTWFuYWdlZEJ5OiAnQ0RLJyxcbi8vICAgfSxcbi8vIH0pOyJdfQ==