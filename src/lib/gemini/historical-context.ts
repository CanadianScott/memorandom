import { client } from "./client";
import {
  HistoricalContextRequest,
  HistoricalPromptItem,
  HistoricalContextResponse,
} from "../../types/historical-context";

interface FallbackMatrixItem {
  id: string;
  historicalEvent: string;
  year: number;
  yearOrEra: string;
  location: string;
  regions: string[];
  scope: "local" | "national";
  sourceDetails: string;
  question: string;
  followUps: string[];
  visualQuery: string;
  mapQuery: string;
  artPrompt: string;
}

export const HISTORICAL_FALLBACK_MATRIX: FallbackMatrixItem[] = [
  // --- 1930s ---
  {
    id: "chicago-century-of-progress-1933",
    historicalEvent: "A Century of Progress International Exposition",
    year: 1933,
    yearOrEra: "1933",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Tribune archives, May 27, 1933",
    question: "Did your family ever talk about visiting the Century of Progress World's Fair on Chicago's lakefront, or do you remember seeing keepsakes and sky ride photos from that summer?",
    followUps: ["Did anyone in your family keep a souvenir coin or guidebook?", "What stories did older relatives share about the lakefront during the Depression?"],
    visualQuery: "vintage 1933 Chicago World Fair Century of Progress sky ride lakefront",
    mapQuery: "Northerly Island, Chicago, Illinois",
    artPrompt: "The 1933 Chicago World's Fair illuminated against Lake Michigan at dusk, art deco pavilions and sky ride towers, vintage postcard style",
  },
  {
    id: "golden-gate-bridge-1937",
    historicalEvent: "Opening of the Golden Gate Bridge",
    year: 1937,
    yearOrEra: "1937",
    location: "San Francisco, California",
    regions: ["national", "california", "san francisco"],
    scope: "national",
    sourceDetails: "San Francisco Chronicle archives, May 27, 1937",
    question: "Do you remember hearing about the opening of the Golden Gate Bridge in 1937, or the first time you ever laid eyes on that grand orange span across the bay?",
    followUps: ["Were you surprised by how bright the orange paint looked?", "Did you ever walk across the pedestrian span?"],
    visualQuery: "vintage 1937 Golden Gate Bridge opening day pedestrian walk",
    mapQuery: "Golden Gate Bridge, San Francisco, California",
    artPrompt: "The Golden Gate Bridge shining in international orange fog over San Francisco Bay in 1937, vintage sepia and oil painting tones",
  },
  {
    id: "war-of-the-worlds-1938",
    historicalEvent: "Orson Welles 'War of the Worlds' Radio Broadcast",
    year: 1938,
    yearOrEra: "1938",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "CBS Radio archives, October 30, 1938",
    question: "Do you remember the night Orson Welles broadcast 'The War of the Worlds' on the radio, or how your family gathered around the wooden radio cabinet in the evenings?",
    followUps: ["Did anyone you knew believe the broadcast was real?", "What was your favorite radio serial or bedtime program to tune into?"],
    visualQuery: "vintage 1930s family listening to console radio living room",
    mapQuery: "Grover's Mill, New Jersey",
    artPrompt: "A family gathered closely around a glowing wooden cathedral radio console in a dimly lit 1930s parlor, warm amber glow",
  },
  {
    id: "empire-state-building-1931",
    historicalEvent: "Opening of the Empire State Building",
    year: 1931,
    yearOrEra: "1931",
    location: "New York, New York",
    regions: ["new york", "nyc", "mid-atlantic"],
    scope: "local",
    sourceDetails: "New York Times archives, May 1, 1931",
    question: "Do you remember hearing about the Empire State Building opening as the tallest skyscraper in the world, or your first visit up to the open-air observation deck?",
    followUps: ["How did it feel looking down on the streets below?", "Were you amazed by how fast the elevators climbed?"],
    visualQuery: "vintage 1931 Empire State Building opening day New York City",
    mapQuery: "Empire State Building, New York, NY",
    artPrompt: "The Empire State Building towering into 1930s New York City skies, classic black and white photography with silver gelatin tone",
  },

  // --- 1940s ---
  {
    id: "wrigley-field-world-series-1945",
    historicalEvent: "1945 World Series at Wrigley Field",
    year: 1945,
    yearOrEra: "1945",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Daily News, October 1945",
    question: "Do you recall the buzz in Chicago during the 1945 World Series at Wrigley Field, or listening to the games crackle over the neighborhood radios?",
    followUps: ["Were you or your parents Cubs fans?", "What was the atmosphere like on the North Side streets on game days?"],
    visualQuery: "vintage 1945 Wrigley Field Chicago Cubs World Series crowd",
    mapQuery: "Wrigley Field, Chicago, Illinois",
    artPrompt: "Fans packed into the ivy-walled grandstands of Wrigley Field on an autumn afternoon in 1945, Kodachrome vintage tones",
  },
  {
    id: "v-j-day-celebrations-1945",
    historicalEvent: "V-J Day World War II Victory Celebrations",
    year: 1945,
    yearOrEra: "1945",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "Associated Press historical records, August 14-15, 1945",
    question: "Where were you in August 1945 when church bells rang and neighborhood streets filled with celebrations that the war was finally over?",
    followUps: ["Did your neighborhood hold an impromptu block party or parade?", "Who in your family or community were you most eager to welcome home?"],
    visualQuery: "vintage 1945 V-J Day street celebration confetti parade",
    mapQuery: "Times Square, New York, NY",
    artPrompt: "Jubilant crowds dancing in confetti-filled city streets celebrating the end of World War II in 1945, documentary film grain",
  },
  {
    id: "jackie-robinson-1947",
    historicalEvent: "Jackie Robinson Breaks Baseball's Color Barrier",
    year: 1947,
    yearOrEra: "1947",
    location: "New York, New York",
    regions: ["national", "new york", "nyc", "brooklyn"],
    scope: "national",
    sourceDetails: "Brooklyn Eagle, April 15, 1947",
    question: "Do you remember when Jackie Robinson took the field for the Brooklyn Dodgers in 1947, breaking baseball's color barrier?",
    followUps: ["Did you follow baseball on the radio or in the morning newspaper?", "How did people in your circle talk about his courage?"],
    visualQuery: "vintage 1947 Jackie Robinson Brooklyn Dodgers Ebbets Field",
    mapQuery: "Ebbets Field, Brooklyn, New York",
    artPrompt: "Jackie Robinson in Dodger blue stepping up to home plate at historic Ebbets Field in 1947, classic sports photography",
  },
  {
    id: "detroit-auto-boom-1948",
    historicalEvent: "Post-War Automotive Assembly Boom",
    year: 1948,
    yearOrEra: "1948",
    location: "Detroit, Michigan",
    regions: ["midwest", "detroit", "michigan"],
    scope: "local",
    sourceDetails: "Detroit Free Press archives, 1948",
    question: "Do you remember the post-war excitement when sleek new automobile designs rolled off Midwest assembly lines with chrome grills and curved glass?",
    followUps: ["What was the first car your family or neighbors bought after the war?", "Do you remember the distinctive smell of new car interiors back then?"],
    visualQuery: "vintage 1948 Detroit auto assembly line shiny new cars",
    mapQuery: "Detroit, Michigan",
    artPrompt: "A shiny brand-new post-war American automobile parked in front of a tree-lined Midwestern home in 1948, warm Kodachrome",
  },

  // --- 1950s ---
  {
    id: "riverview-amusement-park-1953",
    historicalEvent: "Riverview Amusement Park's Heyday",
    year: 1953,
    yearOrEra: "1953",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Tribune archives, Summer 1953",
    question: "Did you ever ride 'The Bobs' roller coaster or taste the caramel popcorn at Riverview Amusement Park on Chicago's North Side?",
    followUps: ["Were you daring enough to ride the fast coasters, or did you prefer the carousel?", "What sights and sounds do you recall from carnival nights there?"],
    visualQuery: "vintage 1950s Riverview Park Chicago amusement park Bobs coaster",
    mapQuery: "Belmont and Western, Chicago, Illinois",
    artPrompt: "The wooden trestles of Riverview Amusement Park lit up with festive incandescent bulbs on a warm summer night in 1953, vintage illustration",
  },
  {
    id: "ohare-airport-opening-1955",
    historicalEvent: "Opening of Chicago O'Hare International Airport",
    year: 1955,
    yearOrEra: "1955",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Sun-Times, October 30, 1955",
    question: "Do you remember when Chicago opened O'Hare Airport for commercial flights in 1955, or the first time you watched airliners take off from the observation deck?",
    followUps: ["Did you ever fly in a propeller plane or an early commercial jet?", "How did travel change for your family once airports expanded?"],
    visualQuery: "vintage 1955 Chicago OHare airport terminal observation deck",
    mapQuery: "O'Hare International Airport, Chicago, Illinois",
    artPrompt: "Families waving from the open-air observation deck at O'Hare airport as a vintage airliner taxis across the tarmac in 1955, retro travel poster",
  },
  {
    id: "salk-polio-vaccine-1955",
    historicalEvent: "Jonas Salk Polio Vaccine Rollout",
    year: 1955,
    yearOrEra: "1955",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "Associated Press historical archives, April 12, 1955",
    question: "Do you remember the sense of relief across the neighborhood in 1955 when Jonas Salk's polio vaccine was declared safe and lines formed at the local school?",
    followUps: ["Do you remember getting the vaccine at school on a sugar cube or with a shot?", "How did fear of polio affect summers when you were young?"],
    visualQuery: "vintage 1955 children school polio vaccine sugar cube line",
    mapQuery: "Ann Arbor, Michigan",
    artPrompt: "A school gymnasium in 1955 with mothers and children waiting peacefully in a sunny line for the vaccine, gentle pastel illustration",
  },
  {
    id: "first-mcdonalds-desplaines-1955",
    historicalEvent: "Ray Kroc's First McDonald's Franchise in Des Plaines",
    year: 1955,
    yearOrEra: "1955",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Des Plaines Suburban Historical Records, April 15, 1955",
    question: "Do you remember the fifteen-cent hamburgers and red-and-white tiled stands when the first golden arches franchise opened in Des Plaines in 1955?",
    followUps: ["What was your favorite local drive-in or soda fountain growing up?", "Who did you usually go with to grab fries or milkshakes?"],
    visualQuery: "vintage 1955 original McDonalds Des Plaines Illinois golden arches neon",
    mapQuery: "Des Plaines, Illinois",
    artPrompt: "The glowing golden arches of a 1950s roadside drive-in with chrome sedans lined up on an evening in 1955, nostalgic Americana",
  },
  {
    id: "mackinac-bridge-1957",
    historicalEvent: "Completion of the Mackinac Bridge ('Mighty Mac')",
    year: 1957,
    yearOrEra: "1957",
    location: "Mackinaw City, Michigan",
    regions: ["midwest", "michigan"],
    scope: "local",
    sourceDetails: "Detroit News archives, November 1, 1957",
    question: "Did your family ever take a road trip across the grand Mackinac Bridge after it linked Michigan's upper and lower peninsulas in 1957?",
    followUps: ["Do you remember waiting for the car ferries before the bridge was built?", "What was the view like driving high above the Straits of Mackinac?"],
    visualQuery: "vintage 1957 Mackinac Bridge opening day cars crossing Straits of Mackinac",
    mapQuery: "Mackinac Bridge, Michigan",
    artPrompt: "The long suspension spans of the Mackinac Bridge rising gracefully over deep blue waters under crisp autumn skies in 1957",
  },
  {
    id: "brooklyn-dodgers-1955",
    historicalEvent: "Brooklyn Dodgers Win Their Only World Series",
    year: 1955,
    yearOrEra: "1955",
    location: "New York, New York",
    regions: ["new york", "nyc", "brooklyn"],
    scope: "local",
    sourceDetails: "New York Post, October 4, 1955",
    question: "Do you remember the euphoria in the streets when the Brooklyn Dodgers finally defeated the Yankees to win the 1955 World Series?",
    followUps: ["Did you hear horns honking and pots banging out apartment windows?", "Which player on that team was your hero?"],
    visualQuery: "vintage 1955 Brooklyn Dodgers World Series celebration parade",
    mapQuery: "Ebbets Field, Brooklyn, New York",
    artPrompt: "Brooklyn brownstones with banners hung out of windows and neighbors cheering on stoops in October 1955, classic watercolor",
  },

  // --- 1960s ---
  {
    id: "chicago-blizzard-1967",
    historicalEvent: "The Great Chicago Blizzard of 1967",
    year: 1967,
    yearOrEra: "1967",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Tribune archives, January 26-27, 1967",
    question: "Where were you on January 26, 1967, when the epic twenty-three-inch blizzard shut down Chicago, leaving cars abandoned and children sledding down city avenues?",
    followUps: ["Did you have to shovel out your front steps or walk down the middle of quiet streets?", "How long did it take before school or work opened back up?"],
    visualQuery: "vintage 1967 Chicago blizzard Lake Shore Drive buried cars snowdrifts",
    mapQuery: "Lake Shore Drive, Chicago, Illinois",
    artPrompt: "Snowdrifts swallowing vintage 1960s sedans along a quiet Chicago residential street under slate grey skies in January 1967, Kodachrome tone",
  },
  {
    id: "picasso-daley-plaza-1967",
    historicalEvent: "Unveiling of the Picasso Statue at Civic Center Plaza",
    year: 1967,
    yearOrEra: "1967",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Sun-Times archives, August 15, 1967",
    question: "Do you remember when the monumental steel Picasso sculpture was unveiled in Daley Plaza in 1967, and how everyone argued about what it looked like?",
    followUps: ["Did you think it looked like a baboon, a woman, or something else?", "Did you ever slide down its steel sloping base as a young person?"],
    visualQuery: "vintage 1967 Chicago Picasso sculpture unveiling Daley Plaza crowd",
    mapQuery: "Daley Plaza, Chicago, Illinois",
    artPrompt: "Crowds gathered around the towering Cor-Ten steel Picasso sculpture in Daley Plaza with the landmark Chicago skyline behind it in 1967",
  },
  {
    id: "marina-city-towers-1964",
    historicalEvent: "Opening of Chicago's Marina City 'Corncob' Towers",
    year: 1964,
    yearOrEra: "1964",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Architectural Forum & Chicago Tribune archives, 1964",
    question: "Do you remember watching the futuristic twin 'corncob' towers of Marina City rise over the Chicago River in the mid-1960s?",
    followUps: ["Did you ever see the cars spiraling up the lower parking ramps?", "Did you ever visit anyone who lived in those circular riverfront apartments?"],
    visualQuery: "vintage 1964 Marina City towers Chicago River corncob architecture",
    mapQuery: "Marina City, Chicago, Illinois",
    artPrompt: "Marina City's cylindrical towers reflected in the green waters of the Chicago River with vintage motorboats docked below, mid-century modern aesthetic",
  },
  {
    id: "apollo-11-moon-landing-1969",
    historicalEvent: "Apollo 11 Moon Landing",
    year: 1969,
    yearOrEra: "1969",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "NASA Historical Archives, July 20, 1969",
    question: "Where were you on that warm July night in 1969 when Neil Armstrong stepped off the lunar module ladder and walked on the moon?",
    followUps: ["Who were you sitting with as you watched the fuzzy black-and-white broadcast?", "Did you step outside that night and look up at the moon in wonder?"],
    visualQuery: "vintage 1969 Apollo 11 moon landing television broadcast living room family",
    mapQuery: "Kennedy Space Center, Florida",
    artPrompt: "A cozy 1969 living room illuminated by the glowing blue light of a rabbit-eared television showing the first moonwalk, nostalgic Kodachrome",
  },
  {
    id: "beatles-ed-sullivan-1964",
    historicalEvent: "The Beatles First Appearance on The Ed Sullivan Show",
    year: 1964,
    yearOrEra: "1964",
    location: "National",
    regions: ["national", "new york"],
    scope: "national",
    sourceDetails: "CBS Television archives, February 9, 1964",
    question: "Do you remember watching The Beatles on The Ed Sullivan Show in February 1964, and the excitement that swept through the next morning?",
    followUps: ["Which of the four was your favorite?", "Did you or your friends buy their 45-rpm records or play them on a portable turntable?"],
    visualQuery: "vintage 1964 Beatles Ed Sullivan Show television screen teenagers screaming",
    mapQuery: "Ed Sullivan Theater, New York, NY",
    artPrompt: "Teenagers crowded in front of a console television set mesmerized by the four lads from Liverpool in 1964, vibrant vintage photograph",
  },
  {
    id: "ny-worlds-fair-1964",
    historicalEvent: "1964-1965 New York World's Fair at Flushing Meadows",
    year: 1964,
    yearOrEra: "1964",
    location: "New York, New York",
    regions: ["new york", "nyc", "national"],
    scope: "local",
    sourceDetails: "New York Times archives, April 1964",
    question: "Did you visit the 1964 New York World's Fair in Flushing Meadows, or do you remember the stainless steel Unisphere and futuristic exhibits?",
    followUps: ["Did you taste Belgian waffles with strawberries and whipped cream there?", "What did you think the year 2000 would look like based on those pavilions?"],
    visualQuery: "vintage 1964 New York Worlds Fair Unisphere Flushing Meadows crowds",
    mapQuery: "Flushing Meadows Corona Park, Queens, New York",
    artPrompt: "The towering steel Unisphere reflecting the summer sun with cheerful visitors strolling along geometric fountains in 1964",
  },
  {
    id: "northeast-blackout-1965",
    historicalEvent: "The Great Northeast Blackout of 1965",
    year: 1965,
    yearOrEra: "1965",
    location: "New York, New York",
    regions: ["new york", "mid-atlantic", "national"],
    scope: "local",
    sourceDetails: "Associated Press archives, November 9, 1965",
    question: "Do you remember the night in November 1965 when the entire Northeast plunged into darkness and neighbors lit candles and shared stoop conversations?",
    followUps: ["How did your household manage without electricity that evening?", "Did you feel fear, or was there an unexpected sense of neighborly adventure?"],
    visualQuery: "vintage 1965 New York City blackout skyline moonlight candles",
    mapQuery: "Manhattan, New York, NY",
    artPrompt: "The silhouettes of Manhattan skyscrapers under a bright full moon with glowing candlelight flickering in apartment windows during the 1965 blackout",
  },
  {
    id: "yellowstone-road-trip-1965",
    historicalEvent: "Yellowstone National Park Family Road Trip Boom",
    year: 1965,
    yearOrEra: "1965",
    location: "Yellowstone National Park, Wyoming",
    regions: ["yellowstone", "wyoming", "west", "national"],
    scope: "local",
    sourceDetails: "National Park Service historical logs, 1965",
    question: "Did you ever pack into the family car for a summer road trip to Yellowstone to see Old Faithful erupt or watch wildlife from the highway?",
    followUps: ["What kind of car did your family drive on those long highway journeys?", "Do you remember smelling sulfur near the geyser pools or sleeping in a canvas tent?"],
    visualQuery: "vintage 1965 Yellowstone Old Faithful geyser station wagon family",
    mapQuery: "Old Faithful, Yellowstone National Park, Wyoming",
    artPrompt: "A 1960s wood-paneled station wagon pulled over near steaming geysers at Yellowstone National Park, crisp alpine sunlight and pine trees",
  },

  // --- 1970s ---
  {
    id: "sears-tower-1973",
    historicalEvent: "Opening of the Sears Tower (Willis Tower)",
    year: 1973,
    yearOrEra: "1973",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Tribune archives, May 1973",
    question: "Do you remember when the Sears Tower opened in 1973 as the world's tallest building, or your first ride up to the skydeck?",
    followUps: ["Did your ears pop on the fast elevator ride to the 103rd floor?", "Could you spot your home neighborhood looking down through the haze?"],
    visualQuery: "vintage 1973 Sears Tower Willis Tower Chicago skyline construction",
    mapQuery: "Willis Tower, Chicago, Illinois",
    artPrompt: "The black steel columns of the Sears Tower soaring into the clouds over the Chicago Loop in 1973, architectural drawing style",
  },
  {
    id: "us-bicentennial-1976",
    historicalEvent: "United States Bicentennial Celebrations",
    year: 1976,
    yearOrEra: "1976",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "National Bicentennial Commission records, July 4, 1976",
    question: "How did you celebrate the Fourth of July in 1976 for the Bicentennial—did your town hold a parade, a block party, or fireworks?",
    followUps: ["Did you paint a fire hydrant or decorate your bike in red, white, and blue?", "What was the music playing at the barbecue that afternoon?"],
    visualQuery: "vintage 1976 US Bicentennial parade July 4 fireworks flags",
    mapQuery: "Philadelphia, Pennsylvania",
    artPrompt: "A 1976 small-town Fourth of July street parade with children riding bicycles decorated in red, white, and blue crepe paper, warm Kodachrome",
  },
  {
    id: "blizzard-of-78",
    historicalEvent: "The Great Blizzard of 1978",
    year: 1978,
    yearOrEra: "1978",
    location: "Midwest",
    regions: ["midwest", "ohio", "indiana", "michigan", "illinois"],
    scope: "local",
    sourceDetails: "National Weather Service historical summaries, January 26, 1978",
    question: "Do you remember being snowed in during the catastrophic Blizzard of '78 when howling winds piled drifts up to the second-story eaves?",
    followUps: ["How many days did you stay trapped inside drinking hot cocoa?", "Did you have to shovel out neighbors or hike to the grocery store?"],
    visualQuery: "vintage 1978 Midwest blizzard buried houses snowdrifts Ohio Indiana",
    mapQuery: "Cleveland, Ohio",
    artPrompt: "A Midwestern suburban street buried under massive white snowdrifts with icicles hanging from porches in late January 1978",
  },
  {
    id: "chicago-blizzard-1979",
    historicalEvent: "The Chicago Blizzard of 1979",
    year: 1979,
    yearOrEra: "1979",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Daily News archives, January 13-14, 1979",
    question: "Do you remember the 1979 Chicago blizzard that dumped twenty-nine inches of snow and turned whole city avenues into quiet winter hiking trails?",
    followUps: ["Did you save a parking space on your block with lawn chairs?", "How did you manage getting to work or school on the snow-clogged CTA?"],
    visualQuery: "vintage 1979 Chicago blizzard CTA train tracks snowdrifts",
    mapQuery: "Chicago, Illinois",
    artPrompt: "A vintage CTA 'L' train clearing its way through deep snow banks in Chicago during the winter of 1979, atmospheric urban scene",
  },
  {
    id: "first-earth-day-1970",
    historicalEvent: "The First Earth Day",
    year: 1970,
    yearOrEra: "1970",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "Environmental Protection Agency archives, April 22, 1970",
    question: "Do you remember the very first Earth Day in April 1970, when millions gathered in parks and on college campuses to celebrate the environment?",
    followUps: ["Did you participate in a clean-up drive or tree planting that spring?", "Was that the first time you started thinking about conservation?"],
    visualQuery: "vintage 1970 first Earth Day teach-in college campus park flowers",
    mapQuery: "Central Park, New York, NY",
    artPrompt: "College students and families sitting on grassy park lawns with acoustic guitars and handmade ecology signs in April 1970, soft watercolor",
  },
  {
    id: "twin-towers-1973",
    historicalEvent: "Dedication of the World Trade Center Twin Towers",
    year: 1973,
    yearOrEra: "1973",
    location: "New York, New York",
    regions: ["new york", "nyc", "mid-atlantic"],
    scope: "local",
    sourceDetails: "Port Authority of New York archives, April 4, 1973",
    question: "Do you remember when the Twin Towers of the World Trade Center were dedicated in Lower Manhattan, completely reshaping the harbor skyline?",
    followUps: ["Did you ever dine at Windows on the World or stand on the South Tower observation deck?", "How did they look from the Staten Island Ferry?"],
    visualQuery: "vintage 1973 World Trade Center Twin Towers Lower Manhattan skyline",
    mapQuery: "Lower Manhattan, New York, NY",
    artPrompt: "The silvery Twin Towers standing tall in the Lower Manhattan sunshine against the blue harbor waters in 1973",
  },

  // --- 1980s ---
  {
    id: "chicago-bears-super-bowl-1985",
    historicalEvent: "The 1985 Chicago Bears Super Bowl Victory",
    year: 1985,
    yearOrEra: "1985",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Tribune archives, January 1986",
    question: "Do you remember the football fever in Chicago during the 1985 Bears season, the 'Super Bowl Shuffle,' and where you watched Super Bowl XX?",
    followUps: ["Did you buy the record or wear headband sunglasses like Jim McMahon?", "What was the celebration like in your home or favorite neighborhood tavern?"],
    visualQuery: "vintage 1985 Chicago Bears Super Bowl Shuffle Soldier Field fans",
    mapQuery: "Soldier Field, Chicago, Illinois",
    artPrompt: "A Chicago living room in January 1986 filled with cheering fans in navy and orange jerseys celebrating the Bears championship, lively retro illustration",
  },
  {
    id: "taste-of-chicago-1980",
    historicalEvent: "Inaugural Taste of Chicago in Grant Park",
    year: 1980,
    yearOrEra: "1980",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Sun-Times, July 4, 1980",
    question: "Did you ever stroll through Grant Park for the Taste of Chicago when it first began on Fourth of July weekend in 1980?",
    followUps: ["What was your favorite neighborhood restaurant booth to wait in line for?", "Do you remember the aroma of ribs and pizza drifting across the lakefront?"],
    visualQuery: "vintage 1980 Taste of Chicago Grant Park food festival crowds lakefront",
    mapQuery: "Grant Park, Chicago, Illinois",
    artPrompt: "Crowds sampling pizza slices and ribs along Grant Park with Buckingham Fountain spouting in the background on a hot July afternoon in 1980",
  },
  {
    id: "statue-of-liberty-centennial-1986",
    historicalEvent: "Statue of Liberty Centennial Rededication",
    year: 1986,
    yearOrEra: "1986",
    location: "New York, New York",
    regions: ["new york", "nyc", "national"],
    scope: "local",
    sourceDetails: "New York Times, July 4, 1986",
    question: "Do you remember the grand celebration for the Statue of Liberty's centennial in July 1986, with the tall ships parade and harbor fireworks?",
    followUps: ["Did you watch the tall ships sail up the Hudson River?", "What did Lady Liberty's newly gilded torch mean to you?"],
    visualQuery: "vintage 1986 Statue of Liberty Centennial fireworks New York Harbor tall ships",
    mapQuery: "New York Harbor, New York, NY",
    artPrompt: "The Statue of Liberty glowing against a night sky filled with radiant Fourth of July fireworks over New York Harbor in 1986",
  },
  {
    id: "miracle-on-ice-1980",
    historicalEvent: "The 'Miracle on Ice' Winter Olympic Victory",
    year: 1980,
    yearOrEra: "1980",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "Lake Placid Olympic archives, February 22, 1980",
    question: "Do you remember Al Michaels shouting 'Do you believe in miracles?!' when the young US hockey team beat the Soviets at Lake Placid in 1980?",
    followUps: ["Where were you when the final horn sounded?", "How did that unexpected victory feel during such a tense geopolitical era?"],
    visualQuery: "vintage 1980 Miracle on Ice US Olympic hockey team Lake Placid celebration",
    mapQuery: "Lake Placid, New York",
    artPrompt: "American hockey players embracing on the Olympic ice at Lake Placid waving the American flag in February 1980, dynamic oil painting",
  },
  {
    id: "fall-of-berlin-wall-1989",
    historicalEvent: "The Fall of the Berlin Wall",
    year: 1989,
    yearOrEra: "1989",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "Associated Press archives, November 9, 1989",
    question: "Where were you in November 1989 when the news broke that the Berlin Wall was opened, and people were dancing atop the concrete slabs?",
    followUps: ["Did you stay up late watching the evening news anchors broadcast live?", "Did you ever imagine you would see the Cold War end in your lifetime?"],
    visualQuery: "vintage 1989 Berlin Wall falling crowds atop Brandenburg Gate celebration",
    mapQuery: "Brandenburg Gate, Berlin",
    artPrompt: "Joyful crowds standing atop the graffiti-covered Berlin Wall bathed in floodlights in November 1989, historic newsreel tone",
  },
  {
    id: "farm-aid-1985",
    historicalEvent: "Inaugural Farm Aid Benefit Concert in Illinois",
    year: 1985,
    yearOrEra: "1985",
    location: "Champaign, Illinois",
    regions: ["midwest", "illinois"],
    scope: "local",
    sourceDetails: "Farm Aid organization records, September 22, 1985",
    question: "Do you remember when Willie Nelson, Neil Young, and John Mellencamp held the first Farm Aid concert at Memorial Stadium in Champaign to support family farmers?",
    followUps: ["Did you watch the live broadcast or know families who farmed in the Midwest?", "What songs from that concert stuck with you the most?"],
    visualQuery: "vintage 1985 Farm Aid concert Memorial Stadium Champaign Illinois stage",
    mapQuery: "Memorial Stadium, Champaign, Illinois",
    artPrompt: "A massive stadium concert crowd under the late summer sun with acoustic guitars on stage and banners supporting family farms in 1985",
  },

  // --- 1990s ---
  {
    id: "chicago-bulls-championship-1991",
    historicalEvent: "Chicago Bulls First NBA Championship with Michael Jordan",
    year: 1991,
    yearOrEra: "1991",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "Chicago Tribune archives, June 12, 1991",
    question: "Do you remember where you were in June 1991 when Michael Jordan and the Chicago Bulls won their very first NBA Championship?",
    followUps: ["Were you watching Game 5 against the Lakers at home or at a gathering?", "How did the city celebrate that historic first title?"],
    visualQuery: "vintage 1991 Chicago Bulls championship celebration Chicago Stadium Jordan",
    mapQuery: "Chicago Stadium, Chicago, Illinois",
    artPrompt: "Fans celebrating outside the old brick Chicago Stadium on Madison Street waving red championship banners on a warm June night in 1991",
  },
  {
    id: "chicago-heat-wave-1995",
    historicalEvent: "The Great Chicago Summer Heat Wave of 1995",
    year: 1995,
    yearOrEra: "1995",
    location: "Chicago, Illinois",
    regions: ["chicago", "illinois", "midwest"],
    scope: "local",
    sourceDetails: "National Weather Service & Chicago Sun-Times, July 12-16, 1995",
    question: "Do you remember July 1995 when Chicago temperatures hit one hundred and six degrees and fire hydrants sprayed cool water on children across city blocks?",
    followUps: ["How did your family stay cool during those sweltering days?", "Did you spend afternoons by the lake or in air-conditioned movie theaters?"],
    visualQuery: "vintage 1995 Chicago heat wave open fire hydrant children playing street",
    mapQuery: "Chicago, Illinois",
    artPrompt: "City children laughing as they run through the shimmering spray of an open red fire hydrant on a scorching Chicago street in summer 1995",
  },
  {
    id: "hubble-space-telescope-1990",
    historicalEvent: "Launch of the Hubble Space Telescope",
    year: 1990,
    yearOrEra: "1990",
    location: "National",
    regions: ["national"],
    scope: "national",
    sourceDetails: "NASA Historical Data, April 24, 1990",
    question: "Do you remember when the Hubble Space Telescope was launched into orbit, beginning a whole new chapter of looking deep into outer space?",
    followUps: ["Were you fascinated by the brilliant nebulae and deep space photographs it sent back?", "Did you follow the shuttle mission that repaired its optics?"],
    visualQuery: "vintage 1990 Hubble Space Telescope space shuttle Discovery launch",
    mapQuery: "Kennedy Space Center, Florida",
    artPrompt: "Space Shuttle Discovery rocketing toward the stars with a golden trail of exhaust against deep blue skies in 1990",
  },
  {
    id: "times-square-millennium-1999",
    historicalEvent: "The Millennium Turn at Times Square",
    year: 1999,
    yearOrEra: "1999",
    location: "New York, New York",
    regions: ["new york", "nyc", "national"],
    scope: "local",
    sourceDetails: "New York Times, January 1, 2000",
    question: "How did you ring in the year 2000—were you watching the crystal ball drop in Times Square, worried about Y2K, or celebrating with family?",
    followUps: ["Did you stock up on water or batteries just in case the computers stopped?", "What were your hopes for the new century when the clock struck midnight?"],
    visualQuery: "vintage 1999 Times Square millennium New Years Eve ball drop confetti",
    mapQuery: "Times Square, New York, NY",
    artPrompt: "Two million people gathered under a cascade of glittering confetti in Times Square as the clock strikes midnight for the year 2000",
  },
];

/**
 * Infer the narrator's approximate birth year and birth decade from BKG entities.
 * Heuristic rules:
 * - "1950s Childhood" -> decade 1950, childhood ages ~5-15 -> ~1945
 * - "1960s College" -> decade 1960, college ~age 20 -> ~1940
 * - "1950s" -> ~1945
 * - If explicit birth year or decade is provided, prioritize it.
 */
export function inferBirthYearAndDecade(
  eras?: string[],
  birthDecade?: string,
  birthYear?: number
): { birthYear: number; birthDecade: string } {
  if (birthYear && typeof birthYear === "number" && birthYear > 1890 && birthYear < 2025) {
    const rounded = Math.round(birthYear);
    return {
      birthYear: rounded,
      birthDecade: `${Math.floor(rounded / 10) * 10}s`,
    };
  }

  if (birthDecade) {
    const match = birthDecade.match(/(19\d)0/);
    if (match) {
      const decBase = parseInt(match[1] + "0", 10);
      return {
        birthYear: decBase + 5,
        birthDecade: `${decBase}s`,
      };
    }
  }

  if (eras && eras.length > 0) {
    let earliestInferred: number | null = null;

    for (const era of eras) {
      const lower = era.toLowerCase();

      // Check explicit year e.g. "Born in 1942"
      const bornMatch = lower.match(/(?:born|birth)\s*(?:in\s*)?(\d{4})/i);
      if (bornMatch) {
        const y = parseInt(bornMatch[1], 10);
        if (y > 1890 && y < 2025) {
          earliestInferred = earliestInferred ? Math.min(earliestInferred, y) : y;
          continue;
        }
      }

      // Check 4-digit decade (e.g. 1950s)
      const decMatch = lower.match(/(19\d)0s?/i);
      if (decMatch) {
        const decBase = parseInt(decMatch[1] + "0", 10);

        // Stage heuristics
        if (/childhood|youth|growing\s*up|kid|young|boyhood|girlhood/.test(lower)) {
          // "1950s Childhood" -> ~1945
          const y = decBase - 5;
          earliestInferred = earliestInferred ? Math.min(earliestInferred, y) : y;
        } else if (/high\s*school|teen/.test(lower)) {
          const y = decBase - 15;
          earliestInferred = earliestInferred ? Math.min(earliestInferred, y) : y;
        } else if (/college|university/.test(lower)) {
          const y = decBase - 20;
          earliestInferred = earliestInferred ? Math.min(earliestInferred, y) : y;
        } else {
          // Plain decade (e.g. "1950s") -> assume childhood/formative era baseline
          const y = decBase - 5;
          earliestInferred = earliestInferred ? Math.min(earliestInferred, y) : y;
        }
      }
    }

    if (earliestInferred) {
      return {
        birthYear: earliestInferred,
        birthDecade: `${Math.floor(earliestInferred / 10) * 10}s`,
      };
    }
  }

  // Default fallback for elder life-story narrator (born ~1945, ~81 years old in 2026)
  return {
    birthYear: 1945,
    birthDecade: "1940s",
  };
}

/**
 * Filter and prioritize historical prompts using cognitive memory heuristics:
 * 1. Infantile amnesia cutoff: never ask about events before birthYear + 5.
 * 2. Reminiscence bump: prioritize events between ages 10 and 25 (birthYear + 10 to birthYear + 25).
 * 3. Geographic relevance: prioritize matching locations over generic national milestones.
 */
export function selectFromFallbackMatrix(
  options: {
    birthYear: number;
    locations?: string[];
    eras?: string[];
    excludeEventNames?: string[];
    limit?: number;
  }
): HistoricalPromptItem[] {
  const { birthYear, locations = [], excludeEventNames = [], limit = 4 } = options;
  const cutoffYear = birthYear + 5;
  const bumpStart = birthYear + 10;
  const bumpEnd = birthYear + 25;

  const excludedSet = new Set(excludeEventNames.map((e) => e.toLowerCase().trim()));

  // Normalize search locations
  const normalizedLocs = locations
    .map((l) => l.toLowerCase().replace(/[^a-z0-9 ]/g, " ").trim())
    .filter((l) => l.length > 0);

  const isLocationMatch = (item: FallbackMatrixItem): boolean => {
    if (normalizedLocs.length === 0) return true;
    for (const loc of normalizedLocs) {
      if (item.location.toLowerCase().includes(loc)) return true;
      for (const reg of item.regions) {
        if (loc.includes(reg) || reg.includes(loc)) return true;
      }
    }
    return false;
  };

  // Score candidate items
  const scoredItems = HISTORICAL_FALLBACK_MATRIX
    .filter((item) => {
      // 1. Enforce infantile amnesia cutoff
      if (item.year < cutoffYear) return false;
      // 2. Exclude previously asked events
      if (excludedSet.has(item.historicalEvent.toLowerCase().trim())) return false;
      if (excludedSet.has(item.id.toLowerCase().trim())) return false;
      return true;
    })
    .map((item) => {
      let score = 0;
      const inBump = item.year >= bumpStart && item.year <= bumpEnd;
      const locMatch = isLocationMatch(item);

      // Prioritize reminiscence bump (ages 10-25)
      if (inBump) score += 50;

      // Prioritize local match over national
      if (locMatch && item.scope === "local") {
        score += 60;
      } else if (locMatch) {
        score += 30;
      } else if (item.scope === "national") {
        score += 20;
      }

      // Bonus for being near the center of the reminiscence bump (~age 18-20)
      const idealYear = birthYear + 18;
      const yearDistance = Math.abs(item.year - idealYear);
      score += Math.max(0, 20 - yearDistance);

      return { item, score, inBump, locMatch };
    });

  // Sort descending by score
  scoredItems.sort((a, b) => b.score - a.score);

  // Pick top results ensuring healthy mix of local and national if possible
  const selected: FallbackMatrixItem[] = [];
  for (const candidate of scoredItems) {
    if (selected.length >= limit) break;
    selected.push(candidate.item);
  }

  // Format as HistoricalPromptItem
  return selected.map((item) => ({
    id: item.id,
    question: item.question,
    historicalEvent: item.historicalEvent,
    yearOrEra: item.yearOrEra,
    location: item.location,
    scope: item.scope,
    sourceType: "fallback_matrix",
    sourceDetails: item.sourceDetails,
    followUps: item.followUps,
    visualQuery: item.visualQuery,
    mapQuery: item.mapQuery,
    artPrompt: item.artPrompt,
  }));
}

/**
 * Dual-source historical context generator.
 * Tiers:
 * 1. Gemini 3.8 Flash with Google Search Grounding (`tools: [{ googleSearch: {} }]`)
 * 2. Deterministic offline fallback matrix
 */
export async function getHistoricalContext(
  request: HistoricalContextRequest
): Promise<HistoricalContextResponse> {
  const {
    eras = [],
    locations = [],
    birthDecade,
    birthYear: explicitBirthYear,
    limit = 4,
    excludeEventNames = [],
  } = request;

  const { birthYear, birthDecade: inferredDecade } = inferBirthYearAndDecade(
    eras,
    birthDecade,
    explicitBirthYear
  );

  const cutoffYear = birthYear + 5;
  const bumpStart = birthYear + 10;
  const bumpEnd = birthYear + 25;

  const isKeyAvailable = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "placeholder-key" &&
    process.env.GEMINI_API_KEY !== "your_gemini_api_key_here"
  );

  if (isKeyAvailable) {
    try {
      const locString = locations.length > 0 ? locations.join(", ") : "United States / Midwest";
      const eraString = eras.length > 0 ? eras.join(", ") : inferredDecade;

      const prompt = `You are an expert oral history biographer and historical researcher.
We are conducting a life-story interview with an elder narrator.
Biographical details:
- Estimated Birth Year: ${birthYear} (Birth Decade: ${inferredDecade})
- Known Locations Lived / Visited: ${locString}
- Known Eras: ${eraString}
- Infantile Amnesia Cutoff: Events MUST be in or after year ${cutoffYear}. Never propose events prior to ${cutoffYear}.
- Reminiscence Bump (Ages 10-25): Highly prioritize events between ${bumpStart} and ${bumpEnd}.

Use Google Search to find notable local newspaper archive events, landmark dedications, major weather events, local openings, or cultural milestones that occurred in "${locString}" during the narrator's formative years (${bumpStart} to ${bumpEnd}). Also find major national touchstones if local context is exhausted.

Already used events (DO NOT REPEAT): ${excludeEventNames.join(", ") || "None"}

Return a JSON array of up to ${limit} objects with this EXACT structure:
[
  {
    "id": "slug-id",
    "question": "A gentle, single-part conversational question inviting their personal recollection...",
    "historicalEvent": "Exact name of event (e.g. 'The Blizzard of 1967', 'Picasso Statue Dedication')",
    "yearOrEra": "Year or era string (e.g. '1967')",
    "location": "City, State or Location",
    "scope": "local" or "national",
    "sourceType": "web_search",
    "sourceDetails": "Historical newspaper archive or verified record citation",
    "followUps": ["sensory follow-up 1", "emotional follow-up 2"],
    "visualQuery": "Vintage archival photo search query",
    "mapQuery": "Geographic map query for Leaflet",
    "artPrompt": "Artistic prompt in vintage Kodachrome or watercolor style for image generation"
  }
]

Output ONLY the raw JSON array.`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const responseText = response.text || "";
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as HistoricalPromptItem[];
        // Filter out any items violating infantile amnesia
        const validPrompts = parsed.filter((item) => {
          const numYear = parseInt(item.yearOrEra.replace(/\D/g, ""), 10);
          if (numYear && numYear < cutoffYear) return false;
          return Boolean(item.question && item.historicalEvent);
        });

        if (validPrompts.length > 0) {
          // Ensure all items have necessary fields
          const enriched = validPrompts.map((p, idx) => ({
            id: p.id || `gemini-prompt-${Date.now()}-${idx}`,
            question: p.question,
            historicalEvent: p.historicalEvent,
            yearOrEra: p.yearOrEra || `${birthYear + 15}`,
            location: p.location || locString,
            scope: p.scope || "local",
            sourceType: "web_search" as const,
            sourceDetails: p.sourceDetails || "Google Search Historical Archives",
            followUps: Array.isArray(p.followUps) && p.followUps.length > 0 ? p.followUps : [
              "What do you remember seeing or hearing at that time?",
              "Who were you with when that happened?"
            ],
            visualQuery: p.visualQuery || `vintage ${p.yearOrEra} ${p.historicalEvent} ${p.location}`,
            mapQuery: p.mapQuery || p.location,
            artPrompt: p.artPrompt || `A nostalgic 1960s scene depicting ${p.historicalEvent}, warm vintage Kodachrome film photograph`,
          }));

          return {
            prompts: enriched.slice(0, limit),
            metadata: {
              inferredBirthYear: birthYear,
              erasCovered: eras.length > 0 ? eras : [inferredDecade],
              locationsCovered: locations.length > 0 ? locations : ["United States"],
            },
          };
        }
      }
    } catch (err) {
      console.warn("Gemini Search grounded historical prompt failed, using deterministic matrix:", err);
    }
  }

  // Deterministic offline fallback matrix
  const fallbackPrompts = selectFromFallbackMatrix({
    birthYear,
    locations,
    eras,
    excludeEventNames,
    limit,
  });

  return {
    prompts: fallbackPrompts,
    metadata: {
      inferredBirthYear: birthYear,
      erasCovered: eras.length > 0 ? eras : [inferredDecade],
      locationsCovered: locations.length > 0 ? locations : ["Chicago, Illinois", "National"],
    },
  };
}
