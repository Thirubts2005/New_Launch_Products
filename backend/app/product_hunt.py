import httpx
import logging
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app import schemas, crud, config

logger = logging.getLogger(__name__)

# Curated high-fidelity mock products list as a final offline fallback seeder
MOCK_PRODUCTS = [
    {
        "id": "mock-1",
        "name": "Zenith AI Workspace",
        "tagline": "Unify your docs, tasks, and codebase with local-first LLMs",
        "description": "Zenith is a privacy-first AI companion that indexes your local markdown files, Git repositories, and task lists. It provides off-grid semantic search, summarizes long documents, drafts high-quality content, and schedules daily workflows without uploading a single byte to the cloud.",
        "votes": 342,
        "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://zenith-workspace.ai",
        "category": "AI",
        "days_ago": 0
    },
    {
        "id": "mock-2",
        "name": "DevFlow IDE",
        "tagline": "The lightweight, cloud-native code editor optimized for speed",
        "description": "DevFlow is a lightning-fast browser-based IDE that feels like a native desktop app. It features zero-config workspace instances, collaborative real-time pair programming, live terminal sharing, and seamless git telemetry, allowing developers to spin up complete sandbox environments in seconds.",
        "votes": 215,
        "thumbnail": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://devflow-ide.io",
        "category": "Developer Tools",
        "days_ago": 0
    },
    {
        "id": "mock-3",
        "name": "VaporCSS Studio",
        "tagline": "Visual Tailwind builder with zero-config design systems",
        "description": "Stop wrestling with utility classes. VaporCSS parses your project files, imports custom Tailwind configuration themes, and presents a visual drag-and-drop workspace that lets designers and engineers build production-ready responsive mockups side-by-side with code-perfect accuracy.",
        "votes": 189,
        "thumbnail": "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://vaporcss.studio",
        "category": "Design",
        "days_ago": 0
    },
    {
        "id": "mock-4",
        "name": "Aura Notes",
        "tagline": "Bi-directional journaling with automatic spatial graphing",
        "description": "Aura goes beyond traditional hierarchical folders. As you type your daily notes, it scans entities, concepts, and people, linking them automatically. It renders your journal as an interactive, flyable 3D spatial network, helping you uncover unexpected connections between old ideas.",
        "votes": 512,
        "thumbnail": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://auranotes.app",
        "category": "Productivity",
        "days_ago": 1
    },
    {
        "id": "mock-5",
        "name": "GitPulse",
        "tagline": "Real-time deployment tracking and serverless health telemetry",
        "description": "GitPulse hooks directly into your Github Actions and Vercel builds to monitor post-deployment metrics. It analyzes bundle size expansions, lighthouse speed regressions, and database execution latencies, alerting your team via Slack before performance degradation hits your customers.",
        "votes": 98,
        "thumbnail": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://gitpulse.dev",
        "category": "Developer Tools",
        "days_ago": 1
    },
    {
        "id": "mock-6",
        "name": "PromptSculpt",
        "tagline": "Visual node-based IDE for building modular agent pipelines",
        "description": "Avoid prompt hardcoding in your backend. PromptSculpt lets you visually sketch chain-of-thought pathways, inject external tool nodes, hook up local vectors, and test agent performance. Once complete, compile your node graph into a single, high-performance secure API endpoint.",
        "votes": 277,
        "thumbnail": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://promptsculpt.com",
        "category": "AI",
        "days_ago": 1
    },
    {
        "id": "mock-7",
        "name": "PixelDiff",
        "tagline": "Automated visual regression testing for modern web apps",
        "description": "PixelDiff automates interface validation. It takes pixel-perfect screenshot captures of your application across 12 distinct device resolutions and 4 core browser configurations on every commit. Spot layout displacements, broken font faces, or color mismatches instantly.",
        "votes": 143,
        "thumbnail": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://pixeldiff.io",
        "category": "Design",
        "days_ago": 2
    },
    {
        "id": "mock-8",
        "name": "Specter Analytics",
        "tagline": "Privacy-first event tracking with zero cookie banners",
        "description": "Collect detailed funnel conversions, page views, and user flows without gathering any personally identifiable information. Specter uses secure, ephemeral hash tracking, bypassing cookie banner requirements entirely, and runs on an ultra-lightweight 800-byte tracking script.",
        "votes": 180,
        "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://specter.analytics",
        "category": "Marketing",
        "days_ago": 2
    },
    {
        "id": "mock-9",
        "name": "KubeShield",
        "tagline": "One-click security audits for Kubernetes clusters",
        "description": "Scan your active cluster filesystems, open service ports, secret registries, and base docker configurations for vulnerability leaks. KubeShield delivers comprehensive audit trails, generates visual heatmaps of risky corridors, and writes automated fix scripts to secure leaks immediately.",
        "votes": 88,
        "thumbnail": "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://kubeshield.io",
        "category": "SaaS",
        "days_ago": 2
    },
    {
        "id": "mock-10",
        "name": "SynthVoice AI",
        "tagline": "Convert dry markdown text into studio-quality pod dialogues",
        "description": "SynthVoice is an advanced generative audio engine that synthesizes written content into full conversations between multiple virtual actors. Our voice models incorporate natural pacing, emotional depth, laughter, and contextual breaks, creating publication-ready podcast episodes instantly.",
        "votes": 462,
        "thumbnail": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://synthvoice.ai",
        "category": "AI",
        "days_ago": 3
    },
    {
        "id": "mock-11",
        "name": "DockDockGo",
        "tagline": "Lightweight, memory-efficient desktop Docker companion",
        "description": "Managing local containers shouldn't grind your operating system to a halt. DockDockGo is a native C++ alternative to heavy electron desktops, providing real-time container health metrics, searchable log streams, and visual network route charts using just a tiny fraction of your machine's memory.",
        "votes": 310,
        "thumbnail": "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://dockdockgo.dev",
        "category": "Developer Tools",
        "days_ago": 3
    },
    {
        "id": "mock-12",
        "name": "Chroma Palette",
        "tagline": "Psychology-driven color system token generator",
        "description": "Generate harmonious, accessible color systems grounded in psychological tone analysis. Select a central aura keyword (like 'calming tech' or 'aggressive fintech'), and Chroma immediately produces a broad set of design tokens fully optimized for light/dark contrast standards.",
        "votes": 201,
        "thumbnail": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://chromapalette.com",
        "category": "Design",
        "days_ago": 4
    },
    {
        "id": "mock-13",
        "name": "Vaporize Mail",
        "tagline": "Encrypted temporary mail server with visual proxy filters",
        "description": "Instantly deploy isolated, private email addresses to bypass newsletter spam. Vaporize isolates incoming attachments in cloud sandbox scanners, extracts clean text contents, and forwards raw communications to your primary mailbox while masking your real identity.",
        "votes": 76,
        "thumbnail": "https://images.unsplash.com/photo-1557200134-90327ee9fafa?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://vaporizemail.co",
        "category": "SaaS",
        "days_ago": 4
    },
    {
        "id": "mock-14",
        "name": "MarketGrapher",
        "tagline": "Natural language query builder for stock chart trends",
        "description": "Stop writing SQL queries or building complex filter rules on financial terminals. Type questions like 'Show me all semiconductor firms with double-digit growth and low P/E ratios', and MarketGrapher instantly renders dynamic, real-time interactive technical analysis charts.",
        "votes": 125,
        "thumbnail": "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://marketgrapher.app",
        "category": "Marketing",
        "days_ago": 5
    },
    {
        "id": "mock-15",
        "name": "CarbonCopy AI",
        "tagline": "Instant carbon-aware code translation and container migration",
        "description": "CarbonCopy translates legacy monolithic scripts into lightweight green microservices, optimizing CPU cycles to minimize your cloud architecture's carbon footprint.",
        "votes": 154,
        "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://carboncopy-ai.co",
        "category": "AI",
        "days_ago": 0
    },
    {
        "id": "mock-16",
        "name": "Carma Analytics",
        "tagline": "Real-time connected car diagnostics and fleet carbon footprint tracking",
        "description": "Carma connects to any OBD-II telemetry port to audit engine metrics, compute smart carbon emissions indexing, coach driving safety, and forecast vehicle maintenance costs securely.",
        "votes": 289,
        "thumbnail": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=180&auto=format&fit=crop&q=80",
        "website_url": "https://carma-analytics.com",
        "category": "Marketing",
        "days_ago": 1
    }
]

def classify_category(name: str, tagline: str) -> str:
    """
    Analyzes name and tagline to classify a real Product Hunt launch into a high-fidelity category.
    """
    text = (name + " " + tagline).lower()
    
    if any(keyword in text for keyword in ["ai", "gpt", "llm", "chatbot", "copilot", "nlp", "prompt", "generator", "predictive", "synthesizer"]):
        return "AI"
    if any(keyword in text for keyword in ["css", "ui", "ux", "design", "figma", "tailwind", "theme", "editor", "palette", "logo", "builder"]):
        return "Design"
    if any(keyword in text for keyword in ["api", "db", "database", "git", "github", "docker", "kube", "kubernetes", "code", "dev", "developer", "ide", "boilerplate", "sdk", "deploy", "server", "hosting"]):
        return "Developer Tools"
    if any(keyword in text for keyword in ["analytics", "seo", "marketing", "funnel", "ads", "attribution", "conversion", "sales", "social"]):
        return "Marketing"
    if any(keyword in text for keyword in ["notes", "journal", "productivity", "task", "calendar", "organizer", "project", "todo", "docs", "collaborative"]):
        return "Productivity"
    
    # Default category fallback
    return "SaaS"

def get_curated_unsplash_cover(category: str, item_id: str) -> str:
    """
    Retrieves a curated Unsplash cover image based on category and hash code.
    """
    # Select covers that look gorgeous in obsidian dark themes
    covers = {
        "AI": [
            "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=180",
            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=180",
            "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=180"
        ],
        "Design": [
            "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=180",
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=180",
            "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=180"
        ],
        "Developer Tools": [
            "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=180",
            "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=180",
            "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=180"
        ],
        "Marketing": [
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=180",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=180",
            "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=180"
        ],
        "Productivity": [
            "https://images.unsplash.com/photo-1517842645767-c639042777db?w=180",
            "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=180",
            "https://images.unsplash.com/photo-1484480974693-6ca0a782f029?w=180"
        ],
        "SaaS": [
            "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=180",
            "https://images.unsplash.com/photo-1518770660439-4636190af475?w=180",
            "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=180"
        ]
    }
    
    # Simple hash function based on post ID
    hash_idx = sum(ord(char) for char in item_id)
    category_covers = covers.get(category, covers["SaaS"])
    return category_covers[hash_idx % len(category_covers)]

def strip_html_tags(html_str: str) -> str:
    """
    Utility to strip HTML elements out of Product Hunt Atom description content.
    """
    if not html_str:
        return ""
    # Strip any brackets
    clean = re.compile('<.*?>')
    text = re.sub(clean, '', html_str)
    # Strip double spaces
    text = " ".join(text.split())
    return text.strip()

async def fetch_live_rss_feed_data() -> list:
    """
    Synchronizes real-time product launches directly from Product Hunt's public feed.
    No credentials required. Perfect out-of-the-box integration!
    """
    feed_url = "https://www.producthunt.com/feed"
    logger.info(f"Connecting to public Product Hunt RSS endpoint: {feed_url}")
    
    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(feed_url)
            res.raise_for_status()
            
            # Parse Atom XML
            ns = {"atom": "http://www.w3.org/2005/Atom"}
            root = ET.fromstring(res.content)
            entries = root.findall("atom:entry", ns)
            
            products = []
            for entry in entries:
                # 1. Product ID
                feed_id = entry.find("atom:id", ns).text
                post_id = feed_id.split("Post/")[-1] if "Post/" in feed_id else feed_id
                
                # 2. Product Name
                name = entry.find("atom:title", ns).text
                
                # 3. Product Launch Date
                pub_str = entry.find("atom:published", ns).text
                launch_date = datetime.fromisoformat(pub_str.replace("Z", "+00:00"))
                
                # 4. Product Link
                link_elem = entry.find("atom:link[@rel='alternate']", ns)
                website_url = link_elem.get("href") if link_elem is not None else "https://www.producthunt.com"
                
                # 5. Tagline & Description
                content_elem = entry.find("atom:content", ns)
                content_html = content_elem.text if content_elem is not None else ""
                tagline = strip_html_tags(content_html)
                # Keep it reasonably sized
                if len(tagline) > 100:
                    tagline = tagline[:97] + "..."
                if not tagline:
                    tagline = "Discover a beautiful new tech innovation on LaunchLens."

                # 6. Classifier Categories
                category = classify_category(name, tagline)
                
                # 7. Coverage Images
                thumbnail = get_curated_unsplash_cover(category, post_id)
                
                # 8. Votes score (Simulated based on post ID hash between 95 and 520)
                hash_score = sum(ord(c) for c in post_id)
                votes = (hash_score % 425) + 95

                products.append({
                    "id": f"ph-{post_id}",
                    "name": name,
                    "tagline": tagline,
                    "description": tagline,
                    "votes": votes,
                    "launch_date": launch_date,
                    "thumbnail": thumbnail,
                    "website_url": website_url,
                    "category": category
                })
                
            logger.info(f"Successfully scraped {len(products)} real-time products from Product Hunt RSS feed.")
            return products
            
    except Exception as e:
        logger.error(f"Failed to scrape Product Hunt RSS feed: {str(e)}")
        return []

async def fetch_product_hunt_data() -> list:
    """
    Attempts to fetch data from the Product Hunt GraphQL API V2.
    Accepts direct Bearer token (PRODUCT_HUNT_DEVELOPER_TOKEN) or Client IDs.
    Falls back to RSS Feed scraper if no credentials are provided.
    """
    dev_token = config.settings.PRODUCT_HUNT_DEVELOPER_TOKEN
    client_id = config.settings.PRODUCT_HUNT_CLIENT_ID
    client_secret = config.settings.PRODUCT_HUNT_CLIENT_SECRET

    access_token = None

    # Option A: Check direct Developer Bearer Token (Easiest to fetch)
    if dev_token:
        logger.info("Direct Product Hunt Developer Token identified. Bypassing credentials grant.")
        access_token = dev_token
    
    # Option B: Check Client OAuth Credentials
    elif client_id and client_secret:
        logger.info("Requesting OAuth Authorization token from Product Hunt V2 API...")
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                token_url = "https://api.producthunt.com/v2/oauth/token"
                token_payload = {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "grant_type": "client_credentials"
                }
                token_res = await client.post(token_url, json=token_payload)
                token_res.raise_for_status()
                token_data = token_res.json()
                access_token = token_data.get("access_token")
        except Exception as e:
            logger.error(f"Product Hunt Client Credentials Grant failed: {str(e)}")

    # Execute GraphQL queries if access token is established
    if access_token:
        try:
            logger.info("Executing Product Hunt V2 GraphQL query...")
            async with httpx.AsyncClient(timeout=15.0) as client:
                graphql_url = "https://api.producthunt.com/v2/api/graphql"
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
                query = """
                query {
                  posts(first: 25, order: NEWEST) {
                    edges {
                      node {
                        id
                        name
                        tagline
                        description
                        votesCount
                        createdAt
                        thumbnail {
                          url
                        }
                        website
                        topics {
                          name
                        }
                      }
                    }
                  }
                }
                """
                res = await client.post(graphql_url, json={"query": query}, headers=headers)
                res.raise_for_status()
                data = res.json()
                
                posts_edges = data.get("data", {}).get("posts", {}).get("edges", [])
                products = []
                
                for edge in posts_edges:
                    node = edge.get("node", {})
                    
                    topics = node.get("topics", [])
                    category = topics[0].get("name", "SaaS") if topics else "SaaS"
                    # Classify if generic Category is returned
                    if category.lower() in ["tech", "software", "productivity"]:
                        category = classify_category(node.get("name", ""), node.get("tagline", ""))
                    
                    thumbnail_dict = node.get("thumbnail")
                    thumbnail = thumbnail_dict.get("url") if thumbnail_dict else "https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=180"
                    
                    created_at_str = node.get("createdAt")
                    if created_at_str:
                        launch_date = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
                    else:
                        launch_date = datetime.now(timezone.utc)

                    products.append({
                        "id": f"ph-{node.get('id')}",
                        "name": node.get("name"),
                        "tagline": node.get("tagline", ""),
                        "description": node.get("description", ""),
                        "votes": node.get("votesCount", 0),
                        "launch_date": launch_date,
                        "thumbnail": thumbnail,
                        "website_url": node.get("website"),
                        "category": category
                    })
                    
                logger.info(f"Successfully retrieved {len(products)} products from Product Hunt GraphQL API.")
                return products
        except Exception as e:
            logger.error(f"GraphQL Query execution failed: {str(e)}. Falling back to public feed.")

    # Option C: Public Atom RSS Scraper (Zero-Config Fallback)
    return await fetch_live_rss_feed_data()

def seed_mock_data(db: Session) -> int:
    """
    Seeds local high-fidelity offline mock fallback products list.
    """
    count = 0
    now = datetime.now()
    
    for item in MOCK_PRODUCTS:
        launch_date = now - timedelta(days=item["days_ago"])
        launch_date = launch_date.replace(hour=10, minute=30, second=0, microsecond=0)
        
        product_create = schemas.ProductCreate(
            id=item["id"],
            name=item["name"],
            tagline=item["tagline"],
            description=item["description"],
            votes=item["votes"],
            launch_date=launch_date,
            thumbnail=item["thumbnail"],
            website_url=item["website_url"],
            category=item["category"]
        )
        
        crud.upsert_product(db, product_create)
        count += 1
        
    return count

async def fetch_and_store(db: Session) -> int:
    """
    Orchestrates the synchronization pipeline.
    1. Try GraphQL API V2 (If credentials or developer token exists).
    2. Try live Atom XML RSS feed scraper (Zero-Config fallback, always real-time!).
    3. Try offline high-fidelity seeder fallback.
    """
    products_data = await fetch_product_hunt_data()
    
    if products_data:
        # Success from GraphQL or live Scraper feed!
        for item in products_data:
            product_create = schemas.ProductCreate(
                id=item["id"],
                name=item["name"],
                tagline=item["tagline"],
                description=item["description"],
                votes=item["votes"],
                launch_date=item["launch_date"],
                thumbnail=item["thumbnail"],
                website_url=item["website_url"],
                category=item["category"]
            )
            crud.upsert_product(db, product_create)
        return len(products_data)
    else:
        # Final offline mock backup seeder
        logger.warning("No internet access or feed scraper failed. Booting offline fallback seeder.")
        return seed_mock_data(db)
