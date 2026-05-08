from slowapi import Limiter
from slowapi.util import get_ipaddr

# get_ipaddr reads X-Forwarded-For so each real client IP gets its own bucket
# behind Nginx/Railway/Render instead of the whole world sharing the proxy's IP
limiter = Limiter(key_func=get_ipaddr)
