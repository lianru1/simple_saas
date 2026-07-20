-- Add voice_samples and boundaries columns to skills table
-- These support the enhanced persona architecture (inspired by dot-skill's layered approach)
-- voice_samples: 3-5 direct quotes showing how this person responds in specific scenarios
-- boundaries: 2-3 things this person will NOT do or admit they don't know

ALTER TABLE public.skills
    ADD COLUMN IF NOT EXISTS voice_samples TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS boundaries TEXT[] NOT NULL DEFAULT '{}';
