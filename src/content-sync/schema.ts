import { z } from 'zod';

const identifierSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u, 'Invalid stable identifier.');

const projectSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[a-z0-9][a-z0-9_-]*$/u, 'Project slug must use lowercase ASCII.');

const libraryPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(1000)
  .regex(/^\/(?!.*(?:^|\/)\.\.?(?:\/|$))(?!.*\\)(?!.*\/\/).*$/u, 'Invalid library path.');

const visibilitySchema = z.enum(['public', 'private']);
const promptRoleSchema = z.enum(['system', 'developer', 'user', 'template', 'reference']);
const metadataSchema = z.record(z.string(), z.unknown()).default({});

export const contentProjectSchema = z.object({
  id: identifierSchema,
  slug: projectSlugSchema,
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000).default(''),
  visibility: visibilitySchema,
  defaultLanguage: z.string().trim().min(1).max(50),
  metadata: metadataSchema,
  sourcePath: z.string().trim().min(1).max(1000),
  configHash: z.string().trim().min(1).max(100),
  prune: z.boolean().default(false),
});

export const contentFolderSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  parentId: identifierSchema.nullable(),
  name: z.string().trim().min(1).max(255),
  path: libraryPathSchema,
  depth: z.number().int().min(0).max(100),
  sortOrder: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  visibility: visibilitySchema.nullable().default(null),
  metadata: metadataSchema,
  sourcePath: z.string().trim().min(1).max(1000),
  configHash: z.string().trim().min(1).max(100),
});

export const contentFileSchema = z.object({
  id: identifierSchema,
  projectId: identifierSchema,
  parentId: identifierSchema.nullable(),
  name: z.string().trim().min(1).max(255),
  path: libraryPathSchema,
  depth: z.number().int().min(0).max(100),
  sortOrder: z.number().int().min(-1_000_000).max(1_000_000).default(0),
  visibility: visibilitySchema.nullable().default(null),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(4000).default(''),
  content: z.string().max(500_000),
  language: z.string().trim().min(1).max(50),
  format: z.enum(['markdown', 'text', 'json']),
  promptRole: promptRoleSchema,
  tags: z.array(z.string().trim().min(1).max(100).regex(/^[^,]+$/u)).max(20).default([]),
  variables: z.array(z.string().trim().min(1).max(100)).max(100).default([]),
  metadata: metadataSchema,
  sourcePath: z.string().trim().min(1).max(1000),
  contentHash: z.string().trim().min(1).max(100),
  syncHash: z.string().trim().min(1).max(100),
});

export const contentManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    manifestHash: z.string().trim().regex(/^sha256:[a-f0-9]{64}$/u),
    source: z.string().trim().min(1).max(100),
    generatedAt: z.string().datetime(),
    projects: z.array(contentProjectSchema).max(50),
    folders: z.array(contentFolderSchema).max(5000),
    files: z.array(contentFileSchema).max(2000),
  })
  .superRefine((manifest, context) => {
    const nodeIds = new Map<string, 'folder' | 'file'>();
    for (const folder of manifest.folders) {
      const existing = nodeIds.get(folder.id);
      if (existing) {
        context.addIssue({
          code: 'custom',
          path: ['folders'],
          message: `Node id ${folder.id} is already used by a ${existing}.`,
        });
      } else {
        nodeIds.set(folder.id, 'folder');
      }
    }
    for (const file of manifest.files) {
      const existing = nodeIds.get(file.id);
      if (existing) {
        context.addIssue({
          code: 'custom',
          path: ['files'],
          message: `Node id ${file.id} is already used by a ${existing}.`,
        });
      } else {
        nodeIds.set(file.id, 'file');
      }
    }
  });

export const contentSyncRequestSchema = z.object({
  manifest: contentManifestSchema,
  prune: z.boolean().default(false),
  dryRun: z.boolean().default(false),
});

export type ContentManifest = z.infer<typeof contentManifestSchema>;
export type ContentProject = z.infer<typeof contentProjectSchema>;
export type ContentFolder = z.infer<typeof contentFolderSchema>;
export type ContentFile = z.infer<typeof contentFileSchema>;
export type ContentSyncRequest = z.infer<typeof contentSyncRequestSchema>;
