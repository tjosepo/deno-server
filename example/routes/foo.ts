import "server/crud";
import { get } from "../../mod.ts";

useCors();

after((response) => {});

get(({ request, query, param }) => {});
