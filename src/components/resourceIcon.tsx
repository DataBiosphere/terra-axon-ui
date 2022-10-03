import { Icon, SvgIcon, SxProps, Theme, Tooltip } from "@mui/material";
import { ResourceType, StewardshipType } from "../generated/workspacemanager";

export interface ResourceIconProps {
  resourceType: ResourceType;
  iconProps?: BaseIconProps;
}

export function ResourceIcon({ resourceType, iconProps }: ResourceIconProps) {
  return (
    <Tooltip title={resourceTypeToString(resourceType)}>
      {resourceTypeToIcon(resourceType, iconProps)}
    </Tooltip>
  );
}

export function resourceTypeToString(resourceType: ResourceType) {
  switch (resourceType) {
    case ResourceType.BigQueryDataset:
      return "BigQuery dataset";
    case ResourceType.BigQueryDataTable:
      return "BigQuery table";
    case ResourceType.GcsBucket:
      return "Cloud Storage bucket";
    case ResourceType.GcsObject:
      return "Cloud Storage object";
  }
  return resourceType ? resourceType.toString() : "Unknown resource type";
}

export function stewardshipTypeToString(stewardshipType: StewardshipType) {
  switch (stewardshipType) {
    case StewardshipType.Controlled:
      return "Controlled resource";
    case StewardshipType.Referenced:
      return "Referenced resource";
    default:
      return "Unknown stewardship type";
  }
}

interface BaseIconProps {
  sx?: SxProps<Theme>;
}

function resourceTypeToIcon(
  resourceType: ResourceType | undefined,
  iconProps?: BaseIconProps
) {
  switch (resourceType) {
    case ResourceType.BigQueryDataset:
    case ResourceType.BigQueryDataTable:
      return BigQueryIcon(iconProps);
    case ResourceType.GcsBucket:
    case ResourceType.GcsObject:
      return CloudStorageIcon(iconProps);
  }
  return <Icon {...iconProps}>question_mark</Icon>;
}

const CloudStorageIcon = (props?: BaseIconProps) => (
  <SvgIcon {...props}>
    <path
      id="Shape"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20 11H4V4H20V11ZM20 20H4V13H20V20ZM16 8.5C15.4477 8.5 15 8.05225 15 7.5C15 6.9477 15.4477 6.5 16 6.5C16.5523 6.5 17 6.9477 17 7.5C17 8.05225 16.5523 8.5 16 8.5ZM7 8H13V7H7V8ZM16 17.5C15.4477 17.5 15 17.0522 15 16.5C15 15.9477 15.4477 15.5 16 15.5C16.5523 15.5 17 15.9477 17 16.5C17 17.0522 16.5523 17.5 16 17.5ZM7 17H13V16H7V17Z"
    />
  </SvgIcon>
);

const BigQueryIcon = (props?: BaseIconProps) => (
  <SvgIcon {...props}>
    <path
      id="Shape"
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 11.0005C3 6.58194 6.58188 3.00012 11 3.00012C15.4182 3.00012 19.0001 6.58194 19 11.0006C19 12.7896 18.4127 14.4416 17.4203 15.7741C17.5222 15.7705 17.6253 15.8073 17.7025 15.8845L20.8895 19.0717C21.0368 19.2193 21.0368 19.4611 20.8895 19.6089L19.609 20.8888C19.4612 21.037 19.2193 21.037 19.0716 20.8888L15.885 17.7031C15.8074 17.6255 15.7704 17.5223 15.774 17.4205C14.4414 18.4131 12.7893 19.0006 11 19.0006C6.58188 19.0006 3 15.4187 3 11.0005ZM10.9998 17.0001C7.68608 17.0001 5 14.314 5 11.0003C5 7.68667 7.68608 5.00006 10.9998 5.00006C14.3135 5.00006 17 7.68673 17 11.0003C17 14.314 14.3135 17.0001 10.9998 17.0001ZM7 13.2733V11.0001H9V14.7723C8.17556 14.4021 7.48659 13.8871 7 13.2733ZM10 9.00006V14.9327C10.3399 14.9744 10.6876 15.0001 11.0448 15.0001C11.3709 15.0001 11.6882 14.977 12 14.9422V9.00006H10ZM13.007 14.7001V12.0001H15.007V13.2013C14.5349 13.8129 13.8433 14.3272 13.007 14.7001Z"
    />
  </SvgIcon>
);
