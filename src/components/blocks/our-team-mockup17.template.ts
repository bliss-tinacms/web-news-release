export const ourTeamMockup17BlockSchema = {
  name: 'ourTeamMockup17',
  label: 'Our Team Page Template Sections',
  fields: [
    { type: 'object', name: 'hero', label: 'Hero Section', fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
      { name: 'headline', label: 'Headline', type: 'string' },
      { name: 'lede', label: 'Lede', type: 'string', ui: { component: 'textarea' } },
    ]},
    { type: 'object', name: 'leadership', label: 'Leadership Section', fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'string' },
      { name: 'title', label: 'Title', type: 'string' },
      { name: 'people', label: 'Leadership People', type: 'object', list: true, fields: [
        { name: 'name', label: 'Name', type: 'string' }, { name: 'role', label: 'Role', type: 'string' }, { name: 'location', label: 'Location', type: 'string' },
        { name: 'image', label: 'Photo', type: 'image' }, { name: 'imageAlt', label: 'Photo Alt Text', type: 'string' }, { name: 'bio', label: 'Bio', type: 'string', ui: { component: 'textarea' } },
        { name: 'tagline', label: 'Leadership Tagline', type: 'string' },
        { name: 'recordTitle', label: 'Record Panel Title', type: 'string' },
        { name: 'authorSlug', label: 'Author Archive Slug', type: 'string' },
        { name: 'records', label: 'On-the-record Details', type: 'object', list: true, fields: [
          { name: 'label', label: 'Label', type: 'string' }, { name: 'value', label: 'Value', type: 'string' },
        ]},
      ]},
    ]},
    { type: 'object', name: 'seniorStaff', label: 'Senior Editorial Staff Section', fields: [
      { name: 'eyebrow', label: 'Eyebrow', type: 'string' }, { name: 'title', label: 'Title', type: 'string' },
      { name: 'people', label: 'Staff Cards', type: 'object', list: true, fields: [
        { name: 'name', label: 'Name', type: 'string' }, { name: 'role', label: 'Role', type: 'string' }, { name: 'location', label: 'Location', type: 'string' },
        { name: 'image', label: 'Photo', type: 'image' }, { name: 'imageAlt', label: 'Photo Alt Text', type: 'string' }, { name: 'bio', label: 'Bio', type: 'string', ui: { component: 'textarea' } },
        { name: 'authorSlug', label: 'Author Archive Slug', type: 'string' },
      ]},
    ]},
  ],
};
