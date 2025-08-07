import { DataPoint } from '@/lib/schemas/report';

/**
 * Converts legacy DataPoint arrays to rich text HTML content
 */
export function convertPointsToRichText(points: DataPoint[]): string {
  if (!points || points.length === 0) {
    return '';
  }

  const convertPoint = (point: DataPoint, level: number = 0): string => {
    if (typeof point === 'string') {
      // Simple string point
      return `<p>${point}</p>`;
    } else if (point && typeof point === 'object' && 'heading' in point) {
      // Heading with nested points
      const headingLevel = Math.min(level + 3, 6); // h3, h4, h5, h6
      let html = `<h${headingLevel}>${point.heading}</h${headingLevel}>`;
      
      // Add prose template if available
      if ('prose_template' in point && point.prose_template) {
        html += `<p>${point.prose_template}</p>`;
      }
      
      // Add nested points
      if ('points' in point && Array.isArray(point.points) && point.points.length > 0) {
        html += point.points.map((nestedPoint: any) => convertPoint(nestedPoint, level + 1)).join('');
      }
      
      return html;
    }
    
    return '';
  };

  return points.map(point => convertPoint(point)).join('');
}

/**
 * Migrates a report section from points-based to rich text content
 */
export function migrateSectionToRichText(section: any): any {
  // If section already has content and no points, it's already migrated
  if (section.content && (!section.points || section.points.length === 0)) {
    return section;
  }

  // If section has points but no content, convert points to content
  if (section.points && section.points.length > 0 && !section.content) {
    return {
      ...section,
      content: convertPointsToRichText(section.points),
      points: undefined, // Remove points after migration
      lastUpdated: new Date().toISOString(),
    };
  }

  // If section has both points and content, prefer content but note the migration
  if (section.points && section.points.length > 0 && section.content) {
    console.log(`Section ${section.id} has both points and content. Using content.`);
    return {
      ...section,
      points: undefined, // Remove points after migration
      lastUpdated: new Date().toISOString(),
    };
  }

  // Default case - return as is
  return section;
}

/**
 * Migrates an entire report from points-based to rich text content
 */
export function migrateReportToRichText(report: any): any {
  return {
    ...report,
    sections: report.sections.map(migrateSectionToRichText),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * SQL migration script generator for database migration
 */
export function generateMigrationSQL(): string {
  return `
-- Migration script to convert points to rich text content
-- This should be run in Supabase SQL editor

CREATE OR REPLACE FUNCTION convert_points_to_html(points_json jsonb)
RETURNS text AS $$
DECLARE
    result text := '';
    point_item jsonb;
    nested_point jsonb;
BEGIN
    -- Handle null or empty points
    IF points_json IS NULL OR jsonb_array_length(points_json) = 0 THEN
        RETURN '';
    END IF;
    
    -- Iterate through points array
    FOR point_item IN SELECT * FROM jsonb_array_elements(points_json)
    LOOP
        -- Check if it's a simple string
        IF jsonb_typeof(point_item) = 'string' THEN
            result := result || '<p>' || (point_item #>> '{}') || '</p>';
        -- Check if it's an object with heading
        ELSIF jsonb_typeof(point_item) = 'object' AND point_item ? 'heading' THEN
            result := result || '<h3>' || (point_item ->> 'heading') || '</h3>';
            
            -- Add prose template if exists
            IF point_item ? 'prose_template' AND point_item ->> 'prose_template' != '' THEN
                result := result || '<p>' || (point_item ->> 'prose_template') || '</p>';
            END IF;
            
            -- Add nested points if they exist
            IF point_item ? 'points' AND jsonb_array_length(point_item -> 'points') > 0 THEN
                FOR nested_point IN SELECT * FROM jsonb_array_elements(point_item -> 'points')
                LOOP
                    IF jsonb_typeof(nested_point) = 'string' THEN
                        result := result || '<p>' || (nested_point #>> '{}') || '</p>';
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update reports to migrate points to content
UPDATE reports 
SET sections = (
    SELECT jsonb_agg(
        CASE 
            -- If section has points but no content, convert points to content
            WHEN (section ? 'points' AND jsonb_array_length(section -> 'points') > 0 
                  AND (NOT section ? 'content' OR section ->> 'content' = ''))
            THEN section 
                || jsonb_build_object('content', convert_points_to_html(section -> 'points'))
                - 'points'
                || jsonb_build_object('lastUpdated', now()::text)
            -- If section has both points and content, remove points and keep content
            WHEN (section ? 'points' AND section ? 'content' AND section ->> 'content' != '')
            THEN section 
                - 'points'
                || jsonb_build_object('lastUpdated', now()::text)
            -- Otherwise, keep section as is
            ELSE section
        END
    )
    FROM jsonb_array_elements(sections) AS section
)
WHERE sections IS NOT NULL;

-- Clean up the function
DROP FUNCTION convert_points_to_html(jsonb);

-- Update the updated_at timestamp for migrated reports
UPDATE reports 
SET updated_at = now()
WHERE sections::text LIKE '%points%';
`;
}