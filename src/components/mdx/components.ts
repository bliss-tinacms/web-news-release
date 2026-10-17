import CodeBlock from './CodeBlock.astro';
import YouTubeEmbed from './YouTubeEmbed.astro';
import RichImage from './RichImage.astro';
import EmailLink from '../ui/EmailLink.astro';

export const mdxComponents = {
  YouTubeEmbed,
  code_block: CodeBlock,
  img: RichImage,
  image: RichImage,
  a: EmailLink,
};
