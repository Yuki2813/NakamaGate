from slowapi import Limiter
from slowapi.util import get_ipaddr

# get_ipaddr lee X-Forwarded-For para que cada cliente tenga su propio bucket detrás del proxy.
limiter = Limiter(key_func=get_ipaddr)
