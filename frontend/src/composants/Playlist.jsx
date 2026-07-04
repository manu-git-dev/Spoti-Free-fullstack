export default function Playlist({id,nom}){

    return (
        <div key={id}>
            <h2>{nom}</h2>
            <button>Modifier le nom</button>
            <button>Supprimer la playlist</button>
        </div>
    )
}