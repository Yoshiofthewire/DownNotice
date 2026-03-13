import React from 'react';
import azureIcon from '../assets/providers/azure.svg';
import awsIcon from '../assets/providers/aws.svg';
import gcpIcon from '../assets/providers/gcp.svg';
import githubIcon from '../assets/providers/github.svg';
import cloudflareIcon from '../assets/providers/cloudflare.svg';
import genericIcon from '../assets/providers/generic.svg';

const PROVIDER_ICONS = {
  azure: azureIcon,
  aws: awsIcon,
  gcp: gcpIcon,
  github: githubIcon,
  cloudflare: cloudflareIcon,
  generic: genericIcon
};

export default function ProviderIcon({ icon, size = 28 }) {
  const src = PROVIDER_ICONS[icon] || PROVIDER_ICONS.generic;

  return (
    <img
      src={src}
      alt={`${icon || 'generic'} provider icon`}
      style={{ width: size, height: size, borderRadius: 6 }}
    />
  );
}

export const AVAILABLE_ICONS = [
  { value: 'azure', label: 'Microsoft Azure' },
  { value: 'aws', label: 'Amazon Web Services' },
  { value: 'gcp', label: 'Google Cloud Platform' },
  { value: 'github', label: 'GitHub' },
  { value: 'cloudflare', label: 'Cloudflare' },
  { value: 'generic', label: 'Generic' }
];
