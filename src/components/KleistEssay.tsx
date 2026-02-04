import { Link } from 'react-router-dom'
import './KleistEssay.css'

export default function KleistEssay() {
  return (
    <div className="kleist-essay">
      <div className="essay-content">
        <div className="essay-header">
          <h1>Über das Marionettentheater</h1>
          <p className="essay-author">von Heinrich von Kleist</p>
          <p className="essay-date">1810</p>
        </div>

        <div className="essay-text">
          <p>
            Ich traf, vor ungefähr einem Jahre, in M. einen Herrn, der bei der Oper 
            Tänzer gewesen war, und der durch die Anmut seiner Bewegungen allgemein 
            bewundert wurde. Ich sagte ihm, daß ich mich sehr wundern müsse, daß die 
            Tänzer, die ich auf dem Marionettentheater gesehen hätte, sich so anmutig 
            bewegten, und fragte ihn, ob er glaube, daß der Maschinist, der sie leitet, 
            selbst ein guter Tänzer sein müsse, oder wenigstens den Begriff von dem 
            Schönen im Tanze haben müsse.
          </p>

          <p>
            Er versicherte mir, daß die Sache für ihn keine Schwierigkeit habe. Die 
            Bewegung habe wenig Schwierigkeit, weil der Weg, den die Hand zu machen 
            habe, sehr einfach sei, und meistens gerade, und wenn er krumm sei, so 
            folge er der Linie der Schönheit, und es sei keine Kraft erforderlich, 
            die Puppe zu heben, weil sie, wenn sie falle, von selbst wieder aufstehe. 
            Er fügte hinzu, daß jeder Glied seines Körpers, wenn er es loslasse, von 
            der Schwere, als dem Zentrum der Bewegung, geführt werde, und daß er 
            nichts zu tun habe, als dieses Zentrum, das ist, das Gewicht der Glieder, 
            in der Bewegung zu erhalten, welches eine sehr leichte Sache sei, und 
            daß oft, wenn er nicht wisse, wie er sich bewegen solle, er nur nötig 
            habe, sich zu erinnern, wie es in dem entsprechenden Falle die Puppe 
            gemacht habe, und er würde es finden.
          </p>

          <p>
            Aus dieser Bemerkung, daß die Anmut um so vollkommener sei, je weniger 
            der Geist dabei im Spiele sei, schloß er, daß die höchste Anmut nur in 
            einem Körper erscheinen könne, der entweder gar keinen Verstand habe, 
            oder einen unendlichen, das ist, in dem Gliedermann, oder in dem Gott.
          </p>

          <p>
            Hierauf fragte ich ihn, ob er glaube, daß man diese Anmut, die der Gliedermann 
            besitze, erlernen könne. Er versicherte mir, daß es eine Kunst sei, die 
            man erlernen könne, und daß die Anmut, die der Mensch besitze, nur darin 
            bestehe, daß er sich in dem Zustande der größten Einfachheit und Leichtigkeit 
            befinde, und daß die Kunst darin bestehe, sich in diesem Zustande zu 
            erhalten.
          </p>

          <p>
            Er fügte hinzu, daß die Welt, wie sie sei, nur ein Gedanke Gottes sei, 
            und daß das, was wir Schönheit nennen, nur der Schatten dieses Gedankens 
            auf der Materie sei. Die Puppe sei nichts als der Schatten dieser Schönheit, 
            und der Tänzer sei nichts als der Schatten der Puppe.
          </p>

          <p>
            Ich fragte ihn, ob er glaube, daß man diese Kunst erlernen könne, und 
            ob er sie mir lehren wolle. Er sagte, daß es eine sehr schwere Kunst sei, 
            und daß er selbst sie noch nicht vollkommen beherrsche, daß aber, wenn 
            ich Lust hätte, er mir zeigen wolle, wie man anfange.
          </p>

          <p>
            Er führte mich darauf in sein Zimmer, und ich sah, daß er ein kleines 
            Marionettentheater hatte. Er ließ mich die Puppen tanzen, und ich muß 
            gestehen, daß ich nie etwas Anmutigeres gesehen habe.
          </p>
        </div>

        <div className="essay-navigation">
          <Link to="/" className="nav-link">← Zurück zur Startseite</Link>
          <Link to="/sim" className="nav-link">Zur Simulation →</Link>
        </div>
      </div>
    </div>
  )
}
