const text = (name: string, label: string) => ({ name, label, type: 'string' as const });
const textarea = (name: string, label: string) => ({ name, label, type: 'string' as const, ui: { component: 'textarea' } });
const image = (name: string, label: string) => ({ name, label, type: 'image' as const });

export const homepageTemplateBlockSchema = {
  name: 'homepageTemplate',
  label: 'Homepage — Mockup 31',
  fields: [
    {
      type: 'object', name: 'hero', label: 'Hero', fields: [
        text('tag', 'Tag'), text('title', 'Headline'), textarea('description', 'Description'),
        image('image', 'Hero Image'), text('imageAlt', 'Hero Image Alt Text'),
      ],
    },
    {
      type: 'object', name: 'latest', label: 'Latest Stories', fields: [
        text('title', 'Section Title'), text('updatedLabel', 'Update Label'),
        {
          type: 'object', list: true, name: 'items', label: 'Story Cards',
          ui: { itemProps: (item: any) => ({ label: item?.title || 'Story card' }) },
          fields: [
            text('category', 'Category'), text('meta', 'Secondary Label'), text('title', 'Headline'),
            textarea('description', 'Summary'), image('image', 'Image'), text('imageAlt', 'Image Alt Text'), text('link', 'Link URL'),
          ],
        },
      ],
    },
    {
      type: 'object', name: 'mission', label: 'Our Purpose', fields: [
        text('eyebrow', 'Eyebrow'), text('title', 'Statement'),
        {
          type: 'object', list: true, name: 'paragraphs', label: 'Paragraphs',
          ui: { itemProps: (item: any) => ({ label: item?.text?.slice(0, 48) || 'Paragraph' }) },
          fields: [textarea('text', 'Text'), { name: 'bold', label: 'Bold Paragraph', type: 'boolean' }],
        },
        text('signature', 'Signature'),
      ],
    },
    {
      type: 'object', name: 'coverage', label: 'Coverage Areas', fields: [
        text('eyebrow', 'Eyebrow'), text('title', 'Heading'),
        {
          type: 'object', list: true, name: 'items', label: 'Coverage Cards',
          ui: { itemProps: (item: any) => ({ label: item?.title || 'Coverage card' }) },
          fields: [text('number', 'Number'), text('label', 'Short Label'), text('title', 'Title'), textarea('text', 'Description'), text('link', 'Link URL')],
        },
      ],
    },
    {
      type: 'object', name: 'quote', label: 'Editorial Quote', fields: [
        text('eyebrow', 'Eyebrow'), textarea('quote', 'Quote'), text('author', 'Author'), text('byline', 'Byline'),
        image('image', 'Image'), text('imageAlt', 'Image Alt Text'),
      ],
    },
    {
      type: 'object', name: 'standards', label: 'Editorial Standards', fields: [
        text('eyebrow', 'Eyebrow'), text('title', 'Heading'),
        {
          type: 'object', list: true, name: 'items', label: 'Standards',
          ui: { itemProps: (item: any) => ({ label: item?.tab || 'Standard' }) },
          fields: [text('tab', 'Tab Label'), text('number', 'Number'), textarea('text', 'Description')],
        },
        text('seal', 'Closing Line'),
      ],
    },
    {
      type: 'object', name: 'team', label: 'Newsroom Team', fields: [
        text('eyebrow', 'Eyebrow'), text('title', 'Heading'),
        {
          type: 'object', list: true, name: 'members', label: 'Team Members',
          ui: { itemProps: (item: any) => ({ label: item?.name || 'Team member' }) },
          fields: [image('image', 'Photo'), text('imageAlt', 'Photo Alt Text'), text('name', 'Name'), text('role', 'Role and Location'), textarea('text', 'Description'), text('link', 'Profile Link URL')],
        },
      ],
    },
    {
      type: 'object', name: 'cta', label: 'Write For Us', fields: [
        text('eyebrow', 'Eyebrow'), text('title', 'Heading'), textarea('description', 'Description'),
        {
          type: 'object', list: true, name: 'points', label: 'Pitch Instructions',
          ui: { itemProps: (item: any) => ({ label: item?.text || 'Instruction' }) },
          fields: [text('number', 'Number'), text('text', 'Instruction')],
        },
        text('buttonText', 'Button Text'), text('buttonLink', 'Button Link URL'),
      ],
    },
  ],
};
