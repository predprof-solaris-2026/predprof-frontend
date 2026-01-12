import { Button } from "@/components/ui/button";
import { Snowflake } from "lucide-react";

export function Banner() {
    return (
        <section
            className="w-full min-h-52 rounded-xl bg-cover flex justify-center items-center"
            style={{ backgroundImage: "url(banner.webp)" }}
        >
            <Button className="text-white text-2xl p-7 backdrop-blur-xl bg-blue-400/60 hover:bg-blue-400/40 transition-colors flex justify-between gap-5 items-center">
                <Snowflake className="size-8" />
                <span>Участвуй в новогоднем PvP со своими друзьями!</span>
                <Snowflake className="size-8" />
            </Button>
        </section>
    );
}
