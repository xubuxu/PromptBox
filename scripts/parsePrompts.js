/**
 * Script to parse PROMPTS.md and generate defaultPrompts.ts
 * Run with: node scripts/parsePrompts.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate a deterministic ID based on title
 */
function generateId(title) {
    const hash = crypto.createHash('md5').update(title).digest('hex');
    return `default-${hash.substring(0, 8)}`;
}

/**
 * Extract description from prompt content
 */
function generateDescription(title, content) {
    // Common patterns to extract meaningful description
    const patterns = [
        /I want you to act as (?:a |an )?([^.]+)/i,
        /Act as (?:a |an )?([^.]+)/i,
        /You are (?:a |an )?([^.]+)/i,
        /I want you to be (?:a |an )?([^.]+)/i,
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
            const role = match[1].trim();
            // Capitalize first letter and clean up
            const cleanRole = role.charAt(0).toUpperCase() + role.slice(1);
            return `Act as ${cleanRole.substring(0, 100)}${cleanRole.length > 100 ? '...' : ''}`;
        }
    }

    // Fallback: use title as description
    return `${title} prompt for AI assistance`;
}

/**
 * Generate tags based on title and content
 */
function generateTags(title, content) {
    const tags = new Set();
    const text = `${title} ${content}`.toLowerCase();

    // Development & Programming
    if (/\b(code|programming|developer|software|engineer|debug|api|database|frontend|backend|fullstack|python|javascript|typescript|react|angular|vue|node|sql|git|devops|ci\/cd|docker|kubernetes)\b/i.test(text)) {
        tags.add('Development');
    }

    // Writing & Content
    if (/\b(write|writing|writer|author|content|article|blog|essay|story|novel|poet|screenplay|journalist|copywriter|editor)\b/i.test(text)) {
        tags.add('Writing');
    }

    // Education & Learning
    if (/\b(teach|teacher|tutor|learn|education|student|school|course|lesson|instructor|mentor|training)\b/i.test(text)) {
        tags.add('Education');
    }

    // Business & Marketing
    if (/\b(business|marketing|sales|advertis|brand|startup|entrepreneur|ceo|manager|product|strategy|consulting)\b/i.test(text)) {
        tags.add('Business');
    }

    // Creative & Entertainment
    if (/\b(creative|art|music|design|game|entertainment|storytell|comedian|actor|film|movie|video)\b/i.test(text)) {
        tags.add('Creative');
    }

    // Professional Services
    if (/\b(lawyer|legal|doctor|medical|health|finance|accountant|real estate|consultant|advisor|coach)\b/i.test(text)) {
        tags.add('Professional');
    }

    // AI & Prompts
    if (/\b(prompt|ai|chatgpt|gpt|language model|llm|midjourney|dall-e|stable diffusion)\b/i.test(text)) {
        tags.add('AI');
    }

    // Translation & Language
    if (/\b(translat|language|english|interpret|linguistic|grammar|pronunciation)\b/i.test(text)) {
        tags.add('Language');
    }

    // Role-Play & Simulation
    if (/\b(act as|pretend|role|character|simulate|impersonat|persona)\b/i.test(text)) {
        tags.add('Role-Play');
    }

    // Technical & IT
    if (/\b(it expert|tech|cybersecurity|security|network|system|linux|terminal|console)\b/i.test(text)) {
        tags.add('Technical');
    }

    // Research & Analysis
    if (/\b(research|analysis|analyst|data|statistic|scientist|study|investigate)\b/i.test(text)) {
        tags.add('Research');
    }

    // Lifestyle & Personal
    if (/\b(lifestyle|personal|fitness|travel|food|chef|cook|relationship|life coach|self-help)\b/i.test(text)) {
        tags.add('Lifestyle');
    }

    // If no specific tags, add General
    if (tags.size === 0) {
        tags.add('General');
    }

    return Array.from(tags).slice(0, 5); // Max 5 tags
}

/**
 * Parse PROMPTS.md file
 */
function parsePromptsFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const prompts = [];

    // Match <details> blocks with <summary><strong>Title</strong></summary> and ```md content ```
    const detailsPattern = /<details>\s*<summary><strong>([^<]+)<\/strong><\/summary>\s*[\s\S]*?```(?:md)?\s*([\s\S]*?)```\s*<\/details>/gi;

    let match;
    const timestamp = Date.now();

    while ((match = detailsPattern.exec(content)) !== null) {
        const title = match[1].trim();
        const promptContent = match[2].trim();

        if (title && promptContent) {
            const prompt = {
                id: generateId(title),
                title,
                description: generateDescription(title, promptContent),
                content: promptContent,
                tags: generateTags(title, promptContent),
                isFavorite: false,
                createdAt: timestamp,
                updatedAt: timestamp,
            };
            prompts.push(prompt);
        }
    }

    return prompts;
}

/**
 * Generate TypeScript file with default prompts
 */
function generateDefaultPromptsFile(prompts, outputPath) {
    const content = `/**
 * Default prompts data - Auto-generated from PROMPTS.md
 * Generated at: ${new Date().toISOString()}
 * Total prompts: ${prompts.length}
 */

import type { Prompt } from '@shared/types';

export const DEFAULT_PROMPTS: Prompt[] = ${JSON.stringify(prompts, null, 2)};

export const DEFAULT_PROMPTS_COUNT = ${prompts.length};
`;

    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`Generated ${outputPath} with ${prompts.length} prompts`);
}

// Main execution
const promptsFilePath = path.join(__dirname, '..', 'PROMPTS.md');
const outputFilePath = path.join(__dirname, '..', 'src', 'main', 'defaultPrompts.ts');

console.log('Parsing PROMPTS.md...');
const prompts = parsePromptsFile(promptsFilePath);
console.log(`Found ${prompts.length} prompts`);

// Show sample
if (prompts.length > 0) {
    console.log('\nSample prompt:');
    console.log(JSON.stringify(prompts[0], null, 2));
}

// Generate output file
generateDefaultPromptsFile(prompts, outputFilePath);
console.log('\nDone!');
