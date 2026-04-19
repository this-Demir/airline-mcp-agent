"""City name → IATA airport code mapping with case-insensitive lookup."""

CITY_TO_IATA: dict[str, str] = {
    # Turkey
    "istanbul": "IST",
    "ankara": "ESB",
    "izmir": "ADB",
    "antalya": "AYT",
    "adana": "ADA",
    "trabzon": "TZX",
    "bodrum": "BJV",
    "dalaman": "DLM",
    "gaziantep": "GZT",
    "kayseri": "ASR",
    "konya": "KYA",
    "samsun": "SZF",
    # Europe
    "frankfurt": "FRA",
    "london": "LHR",
    "paris": "CDG",
    "amsterdam": "AMS",
    "berlin": "BER",
    "munich": "MUC",
    "rome": "FCO",
    "madrid": "MAD",
    "barcelona": "BCN",
    "vienna": "VIE",
    "zurich": "ZRH",
    "brussels": "BRU",
    "lisbon": "LIS",
    "athens": "ATH",
    "warsaw": "WAW",
    "budapest": "BUD",
    "prague": "PRG",
    "stockholm": "ARN",
    "oslo": "OSL",
    "copenhagen": "CPH",
    "helsinki": "HEL",
    # Middle East
    "dubai": "DXB",
    "abu dhabi": "AUH",
    "doha": "DOH",
    "riyadh": "RUH",
    "jeddah": "JED",
    "kuwait": "KWI",
    "beirut": "BEY",
    "tel aviv": "TLV",
    "amman": "AMM",
    # Asia
    "tokyo": "NRT",
    "osaka": "KIX",
    "beijing": "PEK",
    "shanghai": "PVG",
    "hong kong": "HKG",
    "singapore": "SIN",
    "bangkok": "BKK",
    "seoul": "ICN",
    "delhi": "DEL",
    "mumbai": "BOM",
    "kuala lumpur": "KUL",
    "jakarta": "CGK",
    # North America
    "new york": "JFK",
    "los angeles": "LAX",
    "chicago": "ORD",
    "miami": "MIA",
    "toronto": "YYZ",
    "washington": "IAD",
    "san francisco": "SFO",
    "boston": "BOS",
    "dallas": "DFW",
    "houston": "IAH",
    # Africa
    "cairo": "CAI",
    "casablanca": "CMN",
    "johannesburg": "JNB",
    "nairobi": "NBO",
    # Russia / CIS
    "moscow": "SVO",
    "st. petersburg": "LED",
    "saint petersburg": "LED",
}


def resolve_iata(city_or_code: str) -> str:
    """Return IATA code for the given city name or 3-letter code.

    If the input is already a 3-letter alphabetic string it is returned
    uppercased. Otherwise a case-insensitive city lookup is attempted.
    Raises ValueError if nothing matches.
    """
    cleaned = city_or_code.strip()
    if len(cleaned) == 3 and cleaned.isalpha():
        return cleaned.upper()
    iata = CITY_TO_IATA.get(cleaned.lower())
    if iata:
        return iata
    raise ValueError(
        f"Unknown airport or city: '{city_or_code}'. "
        "Please provide a valid IATA code (e.g., IST, FRA, JFK)."
    )
