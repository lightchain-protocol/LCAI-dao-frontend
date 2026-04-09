import { ProposalState, ProposalStateLabel } from "@/lib/constents";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleXmark,
  faHourglassClock,
  faHourglassHalf,
  faSignalStream,
  faSquareCheck,
} from "@fortawesome/pro-regular-svg-icons";
import { cn } from "@/lib/utils";

type Props = {
  status: number;
  className?: string;
};

export default function ProposalStatusBadge({ status, className }: Props) {

  switch (status) {
    case ProposalState.Pending:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              className={cn("inline-block mr-2 md:text-lg sm:text-base text-sm text-content-medium", className)}
              icon={faHourglassHalf}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Pending</p>
          </TooltipContent>
        </Tooltip>
      );
    case ProposalState.Active:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              className={cn("inline-block mr-2 md:text-lg sm:text-base text-sm text-content-success-light", className)}
              icon={faSignalStream}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Active</p>
          </TooltipContent>
        </Tooltip>
      );
    case ProposalState.Succeeded:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              className={cn("inline-block mr-2 md:text-lg sm:text-base text-sm text-content-success-light", className)}
              icon={faSquareCheck}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Passed</p>
          </TooltipContent>
        </Tooltip>
      );
    case ProposalState.Canceled:
    case ProposalState.Defeated:
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <FontAwesomeIcon
              className={cn("inline-block mr-2 md:text-lg sm:text-base text-sm text-content-error-light", className)}
              icon={faCircleXmark}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Rejected</p>
          </TooltipContent>
        </Tooltip>
      );
    default:
      return (<Tooltip>
        <TooltipTrigger asChild>
          <FontAwesomeIcon
            className={cn("inline-block mr-2 md:text-lg sm:text-base text-sm text-content-medium", className)}
            icon={faHourglassClock}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{ProposalStateLabel[status]}</p>
        </TooltipContent>
      </Tooltip>)
  }
}
