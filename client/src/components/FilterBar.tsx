import {
  Dropdown,
  Input,
  Option,
  makeStyles,
  tokens,
} from "@fluentui/react-components";
import { SearchRegular } from "@fluentui/react-icons";
import { useMemo, useState } from "react";
import type { Meeting } from "../utils/types";

const useStyles = makeStyles({
  bar: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacingHorizontalM,
    marginBottom: tokens.spacingVerticalL,
    alignItems: "end",
  },
  search: {
    minWidth: "220px",
    flex: 1,
  },
  dropdown: {
    minWidth: "160px",
  },
});

const ALL = "__all__";

interface FilterBarProps {
  meetings: Meeting[];
  userEmail: string;
  onFiltered: (filtered: Meeting[]) => void;
}

export function useFilteredMeetings(meetings: Meeting[], userEmail: string) {
  const [search, setSearch] = useState("");
  const [team, setTeam] = useState(ALL);
  const [sector, setSector] = useState(ALL);
  const [availability, setAvailability] = useState(ALL);

  const teams = useMemo(
    () => [...new Set(meetings.map((m) => m.team).filter(Boolean))].sort(),
    [meetings],
  );

  const sectors = useMemo(
    () => [...new Set(meetings.map((m) => m.sector).filter(Boolean))].sort(),
    [meetings],
  );

  const filtered = useMemo(() => {
    let result = meetings;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (m) =>
          m.subject.toLowerCase().includes(q) ||
          m.original_sender.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.forwarded_by_name.toLowerCase().includes(q),
      );
    }

    if (team !== ALL) {
      result = result.filter((m) => m.team === team);
    }

    if (sector !== ALL) {
      result = result.filter((m) => m.sector === sector);
    }

    if (availability === "available") {
      result = result.filter((m) => m.joined_interns.length < m.capacity);
    } else if (availability === "joined") {
      result = result.filter((m) => m.joined_interns.includes(userEmail));
    }

    return result;
  }, [meetings, search, team, sector, availability, userEmail]);

  return {
    filtered,
    search,
    setSearch,
    team,
    setTeam,
    sector,
    setSector,
    availability,
    setAvailability,
    teams,
    sectors,
  };
}

interface Props {
  search: string;
  onSearchChange: (val: string) => void;
  team: string;
  onTeamChange: (val: string) => void;
  sector: string;
  onSectorChange: (val: string) => void;
  availability: string;
  onAvailabilityChange: (val: string) => void;
  teams: string[];
  sectors: string[];
}

export function FilterBar({
  search,
  onSearchChange,
  team,
  onTeamChange,
  sector,
  onSectorChange,
  availability,
  onAvailabilityChange,
  teams,
  sectors,
}: Props) {
  const styles = useStyles();

  return (
    <div className={styles.bar}>
      <Input
        className={styles.search}
        placeholder="Search meetings…"
        value={search}
        onChange={(_e, data) => onSearchChange(data.value)}
        contentBefore={<SearchRegular />}
        appearance="outline"
      />

      {teams.length > 0 && (
        <Dropdown
          className={styles.dropdown}
          placeholder="All teams"
          value={team === ALL ? "All teams" : team}
          onOptionSelect={(_e, data) => onTeamChange(data.optionValue ?? ALL)}
        >
          <Option value={ALL}>All teams</Option>
          {teams.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Dropdown>
      )}

      {sectors.length > 0 && (
        <Dropdown
          className={styles.dropdown}
          placeholder="All sectors"
          value={sector === ALL ? "All sectors" : sector}
          onOptionSelect={(_e, data) => onSectorChange(data.optionValue ?? ALL)}
        >
          <Option value={ALL}>All sectors</Option>
          {sectors.map((s) => (
            <Option key={s} value={s}>
              {s}
            </Option>
          ))}
        </Dropdown>
      )}

      <Dropdown
        className={styles.dropdown}
        placeholder="Availability"
        value={
          availability === ALL
            ? "All"
            : availability === "available"
              ? "Available"
              : "Joined"
        }
        onOptionSelect={(_e, data) =>
          onAvailabilityChange(data.optionValue ?? ALL)
        }
      >
        <Option value={ALL}>All</Option>
        <Option value="available">Available</Option>
        <Option value="joined">Joined</Option>
      </Dropdown>
    </div>
  );
}
